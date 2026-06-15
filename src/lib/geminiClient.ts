/**
 * geminiClient.ts
 * Centralized Gemini 2.5 Flash API client.
 *
 * Features:
 * - Uses OpenAI-compatible endpoint for Gemini (drop-in replacement for Mistral/OpenAI calls)
 * - Automatic failover: if primary GEMINI_API_KEY fails with 429/500, retries with GEMINI_API_KEY_BACKUP
 * - safeJsonParse: strips markdown code-fence wrappers before parsing JSON
 * - callGeminiVision: direct REST call for multimodal (vision) tasks
 */

import OpenAI from "openai";

// ─── OpenAI-compatible Gemini client factory ────────────────────────────────

function createGeminiClient(apiKey: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
  });
}

// ─── Exported Types ──────────────────────────────────────────────────────────

export type GeminiMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export interface CallGeminiOptions {
  maxTokens?: number;
  temperature?: number;
  responseFormat?: "json_object" | "text";
}

// ─── safeJsonParse ───────────────────────────────────────────────────────────
// Gemini occasionally wraps JSON in ```json ... ``` markdown fences.
// This strips the wrapper before parsing to avoid JSON.parse errors.

export function safeJsonParse<T = any>(content: string): T {
  const cleaned = content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ─── callGemini ──────────────────────────────────────────────────────────────
// Primary function for all text-based AI tasks (assessment, feedback, generation).
// Auto-failover: primary key → backup key → throw.

export async function callGemini(
  messages: GeminiMessage[],
  options: CallGeminiOptions = {}
): Promise<string> {
  const {
    maxTokens = 600,
    temperature = 0.7,
    responseFormat = "json_object",
  } = options;

  const primaryKey = process.env.GEMINI_API_KEY;
  const backupKey = process.env.GEMINI_API_KEY_BACKUP;

  if (!primaryKey) {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add it to your .env file."
    );
  }

  const makeRequest = async (apiKey: string): Promise<string> => {
    const client = createGeminiClient(apiKey);
    const completion = await client.chat.completions.create({
      model: "gemini-2.5-flash",
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(responseFormat === "json_object"
        ? { response_format: { type: "json_object" as const } }
        : {}),
    });
    const content = completion.choices[0]?.message?.content ?? "";
    if (!content) throw new Error("Gemini returned empty response.");
    return content;
  };

  // 1. Try primary key
  try {
    return await makeRequest(primaryKey);
  } catch (primaryErr: any) {
    const isRetryable =
      primaryErr?.status === 429 ||
      primaryErr?.status === 500 ||
      primaryErr?.status === 503 ||
      (typeof primaryErr?.message === "string" &&
        primaryErr.message.includes("rate limit"));

    // 2. Try backup key if available and error is retryable
    if (isRetryable && backupKey && backupKey !== "your_backup_gemini_api_key_here") {
      console.warn(
        `⚠️ [GeminiClient] Primary key failed (${primaryErr?.status ?? primaryErr?.message}). Retrying with backup key...`
      );
      try {
        return await makeRequest(backupKey);
      } catch (backupErr: any) {
        console.error(
          "❌ [GeminiClient] Backup key also failed:",
          backupErr?.message
        );
        throw backupErr;
      }
    }

    // Non-retryable or no backup key — rethrow
    throw primaryErr;
  }
}

// ─── callGeminiVision ────────────────────────────────────────────────────────
// Direct REST call for multimodal (vision) tasks where inline image data is needed.
// Mirrors the existing implementation in questions/analyze/route.ts.

export async function callGeminiVision(
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  const primaryKey = process.env.GEMINI_API_KEY;
  const backupKey = process.env.GEMINI_API_KEY_BACKUP;

  if (!primaryKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const makeVisionRequest = async (apiKey: string): Promise<string> => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { mimeType, data: base64Image } },
          ],
        },
      ],
      generationConfig: { responseMimeType: "application/json" },
    };

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const err: any = new Error(
        `Gemini Vision API error: ${response.status} - ${errorText}`
      );
      err.status = response.status;
      throw err;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini Vision response is empty.");
    return text;
  };

  try {
    return await makeVisionRequest(primaryKey);
  } catch (primaryErr: any) {
    const isRetryable =
      primaryErr?.status === 429 ||
      primaryErr?.status === 500 ||
      primaryErr?.status === 503;

    if (isRetryable && backupKey && backupKey !== "your_backup_gemini_api_key_here") {
      console.warn(
        "⚠️ [GeminiClient Vision] Primary key failed. Retrying with backup key..."
      );
      return await makeVisionRequest(backupKey);
    }

    throw primaryErr;
  }
}
