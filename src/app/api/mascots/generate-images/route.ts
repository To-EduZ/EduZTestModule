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

// Helper: Generate prompt from reference image using Gemini 2.5 Flash
async function describeReferenceImage(base64Image: string, mimeType: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Không tìm thấy GEMINI_API_KEY trong cấu hình hệ thống.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  const prompt = `Analyze this character image. Provide a detailed, concise description (under 50 words) to regenerate this exact character in the same visual style, outfit, colors, and medium (e.g., 3D Pixar cartoon render, 2D simple vector illustration). Do not write intro or outro. Output only the prompt description.`;

  const payload = {
    contents: [
      {
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          }
        ]
      }
    ]
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Gemini Vision API error: ${res.status} - ${errorText}`);
  }

  const json = await res.json();
  const resultText = json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!resultText) {
    throw new Error("Không thể trích xuất mô tả từ ảnh tham chiếu.");
  }

  return resultText.trim();
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

    let baseDescription = prompt || "";

    // Step 1: If reference image is provided, extract its visual description
    if (imageFile) {
      const arrayBuffer = await imageFile.arrayBuffer();
      const base64Image = Buffer.from(arrayBuffer).toString("base64");
      const mimeType = imageFile.type || "image/png";

      console.log("[AI Image Generator] Describing reference image...");
      const extractedDesc = await describeReferenceImage(base64Image, mimeType);
      
      // Append text prompt if user also typed something
      if (baseDescription) {
        baseDescription = `${baseDescription}, ${extractedDesc}`;
      } else {
        baseDescription = extractedDesc;
      }
      console.log("[AI Image Generator] Extracted Base Description:", baseDescription);
    }

    if (!baseDescription) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp mô tả văn bản hoặc tải lên ảnh tham chiếu để tạo Mascot." },
        { status: 400 }
      );
    }

    // Step 2: Define states to generate
    const statePrompts: Record<string, string> = {
      idle: `${baseDescription}, standing in a relaxed neutral pose, plain solid background.`,
      speaking: `${baseDescription}, smiling and talking with mouth open, friendly expression, plain solid background.`,
      listening: `${baseDescription}, cupping ear with hand, listening attentively, plain solid background.`,
      thinking: `${baseDescription}, hand on chin, looking up thoughtful and curious, plain solid background.`,
      happy: `${baseDescription}, celebrating happily with arms raised in victory, plain solid background.`,
      encouraging: `${baseDescription}, giving a warm thumbs up and smiling encouragingly, plain solid background.`
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
      const statePrompt = statePrompts[state] || `${baseDescription}, plain solid background.`;
      const url = await generateImageWithRetry(statePrompt, randomSeedBase);
      generatedUrls[state] = url;
    }

    return NextResponse.json({
      success: true,
      baseDescription,
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
