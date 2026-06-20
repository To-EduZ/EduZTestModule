import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper: Upload base64 data to Cloudinary
async function uploadBase64ToCloudinary(base64Data: string) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      `data:image/jpeg;base64,${base64Data}`,
      { folder: "mascots" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}

// Helper: Upload standard URL to Cloudinary
async function uploadUrlToCloudinary(url: string) {
  return new Promise<any>((resolve, reject) => {
    cloudinary.uploader.upload(
      url,
      { folder: "mascots" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
  });
}

// Helper: Generate Mascot Metadata using Gemini 2.5 Flash
async function generateMascotMetadata(userPrompt: string, base64Image?: string, mimeType?: string) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Không tìm thấy GEMINI_API_KEY trong cấu hình hệ thống.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  const instructionPrompt = `
You are an expert AI assistant designing a language learning mascot for kids.
Analyze the provided text prompt and/or reference image.

Generate the following metadata in JSON format:
1. "name": A creative, kid-friendly Vietnamese name for the mascot (e.g. "Gấu Panda", "Cô Lily", "Sư Tử Leo").
2. "id": A URL-friendly unique identifier, lowercase alphanumeric and dashes only, based on the English name (e.g., "gau-panda", "lily", "leo").
3. "description": A warm 1-2 sentence description in Vietnamese of the mascot's personality and role as an English teacher/helper.
4. "baseDescription": An English visual description (under 50 words) to regenerate this exact character in the same style, clothing, color palette, and medium (e.g. "A cute 3D Pixar style baby panda wearing a red jacket, solid white background").
5. "dialogue":
   - "speaking": A welcoming, supportive sentence in Vietnamese for when the mascot is speaking (with a speaker emoji e.g., "Thầy/Cô đang nói đây, lắng nghe nhé! 🔊").
   - "listening": An encouraging sentence in Vietnamese for when the mascot is listening to the child's pronunciation (with a microphone emoji e.g., "Thầy/Cô đang nghe con nói đây! 🎤").
   - "thinking": A processing sentence in Vietnamese for when the mascot/AI is analyzing the child's speech (with a brain emoji e.g., "Đợi thầy/cô suy nghĩ một chút nhé... 🧠").

Output ONLY a valid JSON object matching this schema. Do not write any markdown code blocks, intro, or outro.
  `;

  const payloadText = userPrompt 
    ? `User request: ${userPrompt}\n\n${instructionPrompt}` 
    : instructionPrompt;

  const parts: any[] = [{ text: payloadText }];

  if (base64Image && mimeType) {
    parts.push({
      inlineData: {
        mimeType: mimeType,
        data: base64Image
      }
    });
  }

  const payload = {
    contents: [{ parts }],
    generationConfig: {
      responseMimeType: "application/json"
    }
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini vision error: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  const resultText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    throw new Error("Không thể trích xuất metadata từ Gemini.");
  }

  try {
    return JSON.parse(resultText.trim());
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", resultText);
    throw new Error("Dữ liệu phản hồi từ AI không đúng định dạng JSON.");
  }
}

// Helper: Generate image using Google AI Studio (Imagen 4) or Pollinations.ai fallback
async function generateImage(prompt: string, seed: number): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-generate-001:predict?key=${apiKey}`;
      const payload = {
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: "1:1" }
      };
      
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const json = await res.json();
        const base64Encoded = json.predictions?.[0]?.bytesBase64Encoded;
        if (base64Encoded) {
          const uploadResult = await uploadBase64ToCloudinary(base64Encoded);
          return uploadResult.secure_url;
        }
      } else {
        const errorText = await res.text();
        console.warn(`Imagen 4 failed (Status ${res.status}): ${errorText}. Falling back to Pollinations.ai.`);
      }
    } catch (err) {
      console.warn("Imagen 4 error, falling back to Pollinations.ai:", err);
    }
  }

  // Fallback Engine: Pollinations.ai
  console.log(`[AI Image Generator] Generating via Pollinations.ai fallback for prompt: "${prompt}"`);
  const encodedPrompt = encodeURIComponent(prompt);
  const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=512&height=512&seed=${seed}&nologo=true`;
  
  const uploadResult = await uploadUrlToCloudinary(pollinationsUrl);
  return uploadResult.secure_url;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function generateImageWithRetry(prompt: string, seed: number, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await generateImage(prompt, seed);
    } catch (err: any) {
      const errMsg = err.message || JSON.stringify(err);
      if (attempt === retries) {
        throw new Error(`Error in loading image from AI Generator after ${retries} attempts: ${errMsg}`);
      }
      console.warn(`[AI Image Generator] Attempt ${attempt} failed: ${errMsg}. Retrying in 4 seconds...`);
      await delay(4000);
    }
  }
  throw new Error("Tất cả các lần thử tạo ảnh AI đều thất bại.");
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const prompt = formData.get("prompt") as string | null;
    const imageFile = formData.get("image") as File | null;
    const state = (formData.get("state") as string) || "all";

    const basePrompt = prompt || "";
    let base64Image: string | undefined;
    let mimeType: string | undefined;

    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      base64Image = Buffer.from(arrayBuffer).toString("base64");
      mimeType = imageFile.type || "image/png";
    }

    if (!basePrompt && !imageFile) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp mô tả văn bản hoặc tải lên ảnh tham chiếu để tạo Mascot." },
        { status: 400 }
      );
    }

    // Step 1: Call Gemini to generate complete metadata (name, id, description, baseDescription, dialogues)
    let metadata: any;
    try {
      console.log("[AI Mascot Generator] Generating metadata using Gemini...");
      metadata = await generateMascotMetadata(basePrompt, base64Image, mimeType);
      console.log("[AI Mascot Generator] Generated Metadata:", metadata);
    } catch (err: any) {
      console.warn("[AI Mascot Generator] Metadata generation failed, using basic fallback:", err);
      // Fallback if Gemini fails
      const fallbackId = `mascot-${Date.now()}`;
      metadata = {
        name: basePrompt ? basePrompt.substring(0, 15) : "Mascot AI",
        id: fallbackId,
        description: basePrompt || "Mascot được tạo tự động bởi trí tuệ nhân tạo.",
        baseDescription: basePrompt || "A cute cartoon character, 3D Pixar style, friendly expression, solid white background.",
        dialogue: {
          speaking: "Thầy/Cô đang nói đây, lắng nghe nhé! 🔊",
          listening: "Thầy/Cô đang nghe con nói đây! 🎤",
          thinking: "Đợi thầy/cô suy nghĩ một chút nhé... 🧠"
        }
      };
    }

    // Step 2: Define state prompts using the English baseDescription
    const statePrompts: Record<string, string> = {
      idle: `${metadata.baseDescription}, standing in a relaxed neutral pose, plain solid background.`,
      speaking: `${metadata.baseDescription}, smiling and talking with mouth open, friendly expression, plain solid background.`,
      listening: `${metadata.baseDescription}, cupping ear with hand, listening attentively, plain solid background.`,
      thinking: `${metadata.baseDescription}, hand on chin, looking up thoughtful and curious, plain solid background.`,
      happy: `${metadata.baseDescription}, celebrating happily with arms raised in victory, plain solid background.`,
      encouraging: `${metadata.baseDescription}, giving a warm thumbs up and smiling encouragingly, plain solid background.`
    };

    const generatedUrls: Record<string, string> = {};
    const randomSeedBase = Math.floor(Math.random() * 10000);

    if (state === "all") {
      // Generate all 6 states sequentially to avoid rate limiting
      const states = Object.keys(statePrompts);
      for (let i = 0; i < states.length; i++) {
        if (i > 0) {
          console.log(`[AI Image Generator] Waiting 2.5 seconds to avoid API rate limits...`);
          await delay(2500);
        }
        
        const stateKey = states[i];
        console.log(`[AI Image Generator] Generating state (${i + 1}/${states.length}): ${stateKey}`);
        const statePrompt = statePrompts[stateKey];
        const seed = randomSeedBase + i;
        
        const url = await generateImageWithRetry(statePrompt, seed);
        generatedUrls[stateKey] = url;
      }
    } else {
      // Generate single state
      const statePrompt = statePrompts[state] || `${metadata.baseDescription}, plain solid background.`;
      const url = await generateImageWithRetry(statePrompt, randomSeedBase);
      generatedUrls[state] = url;
    }

    return NextResponse.json({
      success: true,
      id: metadata.id,
      name: metadata.name,
      description: metadata.description,
      dialogue: metadata.dialogue,
      baseDescription: metadata.baseDescription,
      images: generatedUrls,
      // Avatar URL default is set to idle image
      avatarUrl: generatedUrls.idle || Object.values(generatedUrls)[0]
    });

  } catch (error: any) {
    console.error("Error generating mascot images:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Lỗi máy chủ khi tạo bộ ảnh AI." },
      { status: 500 }
    );
  }
}
