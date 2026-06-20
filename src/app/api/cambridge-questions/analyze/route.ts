import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json({ error: "Missing GROQ_API_KEY" }, { status: 500 });
    }
    
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const teacherWish = (formData.get("teacherWish") as string | null) || "";

    if (!imageFile) {
      return NextResponse.json({ error: "Vui lòng tải lên tệp ảnh hoặc PDF đề thi!" }, { status: 400 });
    }

    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "Dung lượng tệp tin quá lớn (> 10MB)." }, { status: 400 });
    }

    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = imageFile.name.split(".").pop()?.toLowerCase();
    const isPdf = fileExtension === "pdf" || imageFile.type === "application/pdf";
    
    let base64Image = "";
    let mimeType = "";

    if (isPdf) {
      const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "hubxanh_yle_temp_pdf",
            public_id: `temp_${Date.now()}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      let pngUrl = cloudinaryResponse.secure_url;
      if (pngUrl.endsWith(".pdf")) {
        pngUrl = pngUrl.replace(/\.pdf$/, ".png").replace("/image/upload/", "/image/upload/pg_1/");
      }

      const imgRes = await fetch(pngUrl);
      const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
      base64Image = imgBuffer.toString("base64");
      mimeType = "image/png";
    } else {
      base64Image = buffer.toString("base64");
      mimeType = imageFile.type || "image/jpeg";
    }

    const sysPrompt = `You are an AI assistant that digitalizes Cambridge YLE test papers (Starters, Movers, Flyers) from images/PDFs.
Analyze the image and return a JSON object with the following structure. Pay attention to the teacher's wish: "${teacherWish}".

{
  "id": "e.g., LU_P1_01",
  "section": "language-use" or "listening",
  "part": number,
  "taskNumber": number,
  "questionNumberInTask": number,
  "type": "dialogue-mcq" | "gapped-text" | "listening-image" | "listening-mcq" | "listening-detail",
  "testingFocus": "short description of grammar/vocab focus",
  "dialogue": "Optional. Use _____ for blank",
  "passage": "Optional. Use __(1)__ for gaps",
  "gapLabel": "Optional. e.g., (1)",
  "audioText": "Optional transcript if it's a listening task",
  "questionText": "The actual question",
  "options": ["A", "B", "C"],
  "correctAnswer": "The correct option text"
}

If you see multiple questions, just pick the FIRST one clearly visible. Extract text accurately.
Always return ONLY valid JSON.`;

    const aiRes = await groq.chat.completions.create({
      model: "llama-3.2-90b-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: sysPrompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
      response_format: { type: "json_object" }
    });

    const aiText = aiRes.choices[0]?.message?.content || "{}";
    const data = JSON.parse(aiText);

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("AI Analyze YLE Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
