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

// ─── OpenAI-compatible Gemini client factory for OpenRouter ──────────────────

function isOpenRouterKey(apiKey: string): boolean {
  return apiKey.startsWith("sk-or-") || (!!process.env.OPENROUTER_API_KEY && apiKey === process.env.OPENROUTER_API_KEY);
}

function createGeminiClient(apiKey: string): OpenAI {
  const isOR = isOpenRouterKey(apiKey);
  return new OpenAI({
    apiKey,
    baseURL: isOR
      ? "https://openrouter.ai/api/v1"
      : "https://generativelanguage.googleapis.com/v1beta/openai",
    ...(isOR ? {
      defaultHeaders: {
        "HTTP-Referer": "https://eduz.vn", // Optional OpenRouter header
        "X-Title": "EduZ YLE Test Module", // Optional OpenRouter header
      }
    } : {}),
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
  useDeepseekPrimary?: boolean;
  /** Use adaptive test models: xiaomi/mimo-v2.5 (primary) + deepseek/deepseek-v4-flash (fallback) */
  useAdaptiveModels?: boolean;
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
    useDeepseekPrimary = false,
    useAdaptiveModels = false,
  } = options;

  const primaryKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  let backupKey = process.env.GEMINI_API_KEY_BACKUP;
  if (!backupKey && process.env.OPENROUTER_API_KEY && process.env.GEMINI_API_KEY) {
    backupKey = process.env.GEMINI_API_KEY;
  }

  if (!primaryKey) {
    throw new Error(
      "Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured. Please add one to your .env file."
    );
  }

  const makeRequest = async (apiKey: string, modelName: string, disableThinking = false): Promise<string> => {
    const client = createGeminiClient(apiKey);

    // Build request body — disable thinking/reasoning when requested
    const requestBody: any = {
      model: modelName,
      messages,
      max_tokens: maxTokens,
      temperature,
      ...(responseFormat === "json_object"
        ? { response_format: { type: "json_object" as const } }
        : {}),
    };

    // OpenRouter: disable reasoning/thinking via provider-specific params
    if (disableThinking && isOpenRouterKey(apiKey)) {
      requestBody.reasoning = { effort: "none" };
    }

    const completion = await client.chat.completions.create(requestBody);
    const choice = completion.choices[0];
    if (!choice) throw new Error("OpenRouter Gemini returned empty response.");

    if ((choice.finish_reason as string) === "error" || (choice as any).error) {
      const errMsg = (choice as any).error?.message || "OpenRouter generation error";
      const errCode = (choice as any).error?.code || 500;
      const error = new Error(`OpenRouter Error ${errCode}: ${errMsg}`);
      (error as any).status = errCode;
      throw error;
    }

    const content = choice.message?.content ?? "";
    if (!content) throw new Error("OpenRouter Gemini returned empty content.");
    return content;
  };

  // Determine whether to disable thinking/reasoning
  const disableThinking = useAdaptiveModels;

  let primaryModel = isOpenRouterKey(primaryKey) ? "google/gemini-2.5-flash" : "gemini-2.5-flash";
  let fallbackModel = isOpenRouterKey(primaryKey) ? "deepseek/deepseek-v4-flash" : "gemini-2.5-flash";

  if (useAdaptiveModels) {
    // Adaptive test models: deepseek/deepseek-v4-flash (primary) + xiaomi/mimo-v2.5 (fallback)
    primaryModel = "deepseek/deepseek-v4-flash";
    fallbackModel = "xiaomi/mimo-v2.5";
    console.log("🧠 [GeminiClient] ADAPTIVE TEST MODE: Using deepseek/deepseek-v4-flash (primary) + xiaomi/mimo-v2.5 (fallback). Thinking/Reasoning DISABLED.");
  } else if (useDeepseekPrimary) {
    primaryModel = "deepseek/deepseek-v4-flash";
    fallbackModel = isOpenRouterKey(primaryKey) ? "google/gemini-2.5-flash" : "gemini-2.5-flash";
    console.log("🚀 [GeminiClient] Running in DEVELOP MODE: Using DeepSeek v4 Flash as primary and Gemini as fallback.");
  }

  // 1. Try primary key with primary model
  try {
    return await makeRequest(primaryKey, primaryModel, disableThinking);
  } catch (primaryErr: any) {
    console.error(
      `❌ [GeminiClient] Primary model ${primaryModel} failed:`,
      primaryErr?.message || primaryErr
    );

    const isRetryable =
      useDeepseekPrimary ||
      primaryErr?.status === 429 ||
      primaryErr?.status === 500 ||
      primaryErr?.status === 503 ||
      (typeof primaryErr?.message === "string" &&
        (primaryErr.message.includes("rate limit") || primaryErr.message.includes("empty")));

    if (isRetryable) {
      // 2. Try primary key with fallback model (if OpenRouter and models differ)
      if (isOpenRouterKey(primaryKey) && fallbackModel !== primaryModel) {
        console.warn(
          `⚠️ [GeminiClient] Primary key with ${primaryModel} failed. Retrying with fallback model ${fallbackModel}...`
        );
        try {
          return await makeRequest(primaryKey, fallbackModel, disableThinking);
        } catch (fallbackErr: any) {
          console.warn(
            `⚠️ [GeminiClient] Fallback model ${fallbackModel} also failed on primary key:`,
            fallbackErr?.message
          );
        }
      }

      // 3. Try backup key if available
      if (backupKey && backupKey !== "your_backup_gemini_api_key_here") {
        const backupModel = isOpenRouterKey(backupKey) ? "google/gemini-2.5-flash" : "gemini-2.5-flash";
        const backupFallback = isOpenRouterKey(backupKey) ? "deepseek/deepseek-v4-flash" : "gemini-2.5-flash";

        console.warn(
          `⚠️ [GeminiClient] Retrying with backup key...`
        );
        try {
          return await makeRequest(backupKey, backupModel, disableThinking);
        } catch (backupErr: any) {
          if (isOpenRouterKey(backupKey) && backupFallback !== backupModel) {
            console.warn(
              `⚠️ [GeminiClient] Backup key with ${backupModel} failed. Retrying backup with fallback model ${backupFallback}...`
            );
            try {
              return await makeRequest(backupKey, backupFallback, disableThinking);
            } catch (backupFallbackErr: any) {
              console.error(
                "❌ [GeminiClient] Backup key and fallback model also failed:",
                backupFallbackErr?.message
              );
            }
          } else {
            console.error(
              "❌ [GeminiClient] Backup key failed:",
              backupErr?.message
            );
          }
        }
      }
    }

    // Rethrow primary error if fallback also failed
    throw primaryErr;
  }
}

// ─── callGeminiVision ────────────────────────────────────────────────────────
// OpenAI SDK chat completion call for multimodal (vision) tasks.
// Compatible with OpenRouter.

export async function callGeminiVision(
  prompt: string,
  base64Image: string,
  mimeType: string
): Promise<string> {
  const primaryKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;
  let backupKey = process.env.GEMINI_API_KEY_BACKUP;
  if (!backupKey && process.env.OPENROUTER_API_KEY && process.env.GEMINI_API_KEY) {
    backupKey = process.env.GEMINI_API_KEY;
  }

  if (!primaryKey) {
    throw new Error("Neither OPENROUTER_API_KEY nor GEMINI_API_KEY is configured.");
  }

  const makeVisionRequest = async (apiKey: string): Promise<string> => {
    const client = createGeminiClient(apiKey);
    const completion = await client.chat.completions.create({
      model: isOpenRouterKey(apiKey) ? "google/gemini-2.5-flash" : "gemini-2.5-flash",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" as const },
    });

    const choice = completion.choices[0];
    if (!choice) throw new Error("OpenRouter Gemini Vision returned empty response.");

    if ((choice.finish_reason as string) === "error" || (choice as any).error) {
      const errMsg = (choice as any).error?.message || "OpenRouter Vision generation error";
      const errCode = (choice as any).error?.code || 500;
      const error = new Error(`OpenRouter Error ${errCode}: ${errMsg}`);
      (error as any).status = errCode;
      throw error;
    }

    const content = choice.message?.content ?? "";
    if (!content) throw new Error("OpenRouter Gemini Vision returned empty content.");
    return content;
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

