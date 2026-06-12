import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { v2 as cloudinary } from "cloudinary";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import SkillGroup from "@/models/SkillGroup";
import { inMemoryQuestions, inMemorySkillGroups } from "@/lib/dbStore";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(req: NextRequest) {
  try {
    // 1. Verify Groq API Key and Cloudinary config
    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "Vui lòng cấu hình GROQ_API_KEY trong file .env.local để sử dụng tính năng số hóa AI tự động! 🔑" },
        { status: 500 }
      );
    }
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Vui lòng cấu hình đầy đủ Cloudinary để hệ thống tự động bóc tách trang PDF thành ảnh! ☁️" },
        { status: 500 }
      );
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;
    const teacherWish = (formData.get("teacherWish") as string | null) || "";

    if (!imageFile) {
      return NextResponse.json(
        { error: "Vui lòng tải lên tệp ảnh hoặc PDF đề thi để AI bóc tách tự động!" },
        { status: 400 }
      );
    }

    // Validate file size (Cloudinary free tier limit is 10MB for image/PDF uploads)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Dung lượng tệp tin quá lớn (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). ` +
                 `Cloudinary (Free Tier) giới hạn tải lên tệp PDF/ảnh tối đa là 10 MB. ` +
                 `Admin vui lòng cắt riêng trang PDF chứa bài thi nói (thường chỉ < 1 MB) hoặc nén tệp PDF trước khi tải lên nhé! 📕`
        },
        { status: 400 }
      );
    }

    // 3. Convert File to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    const fileExtension = imageFile.name.split(".").pop()?.toLowerCase();
    const isPdf = fileExtension === "pdf" || imageFile.type === "application/pdf";
    
    let base64Image = "";
    let mimeType = "";

    if (isPdf) {
      console.log(`🤖 [AI Auto-Digitalizer] Đang xử lý file PDF thông qua Cloudinary dynamic rendering...`);
      // Upload PDF to temporary folder in Cloudinary
      const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "hubxanh_yle_temp_pdf",
            public_id: `temp_${Date.now()}`,
            resource_type: "image", // PDFs are uploaded as image resource type
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

      console.log(`🤖 [AI Auto-Digitalizer] Đã render xong ảnh từ PDF trên Cloudinary: ${pngUrl}. Đang tải ảnh về để truyền cho AI...`);

      // Fetch the rendered PNG from Cloudinary
      const imgRes = await fetch(pngUrl);
      if (!imgRes.ok) {
        throw new Error("Không thể tải ảnh render từ Cloudinary!");
      }
      const imgArrayBuffer = await imgRes.arrayBuffer();
      const imgBuffer = Buffer.from(imgArrayBuffer);
      
      base64Image = imgBuffer.toString("base64");
      mimeType = "image/png";
    } else {
      base64Image = buffer.toString("base64");
      mimeType = imageFile.type || "image/png";
    }

    /*
    console.log(`🤖 [AI Auto-Digitalizer] Đang phân tích nội dung học liệu qua Llama 4 Vision...`);

    // 4. Query Groq Llama 4 Vision Model
    const completion = await groq.chat.completions.create({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        {
          role: "system",
          content: `You are an expert Cambridge YLE (Young Learners English - Starters, Movers, Flyers) examiner and curriculum designer for primary children.
Your task is to analyze the uploaded exam picture (which could be a Scene Description, Object Card, Storytelling sequence, or Find the Differences) and automatically generate structured metadata matching the Cambridge YLE exam standard.

Analyze the image carefully:
1. Determine the appropriate level ('Starters', 'Movers', or 'Flyers') based on the complexity of vocabulary and objects.
2. Determine which part of the speaking exam it matches (Part 1, Part 2, Part 3, etc.).
3. Choose a context type: 'Scene_Description' (if it's a main scene with many activities), 'Object_Card' (if it's a single item like a banana or frog), 'Storytelling' (if it's a comic panel/sequence of scenes), or 'Find_Differences' (if it has two similar pictures).
4. Generate a unique, short Question ID prefix based on level and part (e.g. 'ST_P1_12' for Starters Part 1, 'MV_P3_08' for Movers Part 3, 'FL_P2_05' for Flyers Part 2). Make the serial number randomly between 10 and 99 to avoid standard duplicates.
5. Write a professional, friendly, child-appropriate 'examinerScript' (what the AI examiner will ask the student in English). The examiner script should ask the child to point out objects or describe activities in the picture. Keep sentences simple and use standard YLE prompts (e.g., "Look at this bedroom. The boy is sleeping. Where is the clock? What is the cat doing?").
6. Provide a list of 'contextTags' describing elements of the image (e.g. ["bedroom", "cat", "animals", "sleeping", "boy"]).
7. Determine 'expectedKeywords' (the critical English vocabulary the child is expected to say in response).
8. Determine 'targetGrammar' structures (e.g., ["present continuous", "prepositions", "there is", "there are"]).

You MUST respond strictly in the following JSON format:
{
  "id": "ST_P1_XY or MV_P3_XY or FL_P2_XY",
  "level": "Starters" | "Movers" | "Flyers",
  "part": number (1 to 5),
  "type": "Scene_Description" | "Object_Card" | "Storytelling" | "Find_Differences",
  "examinerScript": "String of examiner questions in English",
  "contextTags": ["tag1", "tag2", "tag3"],
  "expectedKeywords": ["keyword1", "keyword2", "keyword3"],
  "targetGrammar": ["grammar1", "grammar2"]
}`,
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Analyze this Cambridge YLE exam picture, extract all metadata, and output the exact JSON document.",
            },
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 800,
    });

    const aiResponseContent = completion.choices[0].message.content;
    if (!aiResponseContent) {
      throw new Error("Llama 3.2 Vision trả về phản hồi rỗng.");
    }

    console.log("✅ [AI Auto-Digitalizer] Phân tích hoàn tất:", aiResponseContent);
    const parsedData = JSON.parse(aiResponseContent);
    */
    // 4. Query Google Gemini 2.5 Flash Model
    console.log(`🤖 [AI Auto-Digitalizer] Đang phân tích nội dung học liệu qua Gemini 2.5 Flash...`);

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "Vui lòng cấu hình GEMINI_API_KEY trong file .env.local để sử dụng tính năng số hóa AI tự động! 🔑" },
        { status: 500 }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const geminiPrompt = `You are an expert Cambridge YLE (Young Learners English - Starters, Movers, Flyers) examiner and curriculum designer for primary children.
Your task is to analyze the uploaded exam picture (which could be a Scene Description, Object Card, Storytelling sequence, or Find the Differences) and automatically generate structured metadata matching the Cambridge YLE exam standard.

Teacher's custom pedagogy wishes / special context guidelines:
"${teacherWish}"

Analyze the image carefully and keep the teacher's custom wishes in mind:
1. Determine the appropriate level ('Starters', 'Movers', or 'Flyers') based on the complexity of vocabulary and objects.
2. Determine which part of the speaking exam it matches (Part 1, Part 2, Part 3, etc.).
3. Choose a context type: 'Scene_Description' (if it's a main scene with many activities), 'Object_Card' (if it's a single item like a banana or frog), 'Storytelling' (if it's a comic panel/sequence of scenes), or 'Find_Differences' (if it has two similar pictures).
4. Generate a unique, short Question ID prefix based on level and part (e.g. 'ST_P1_12' for Starters Part 1, 'MV_P3_08' for Movers Part 3, 'FL_P2_05' for Flyers Part 2). Make the serial number randomly between 10 and 99 to avoid standard duplicates.
5. Identify the main general topic (e.g. "Family", "Animals", "School life", "Classroom", "Nature", "Home", "Playground", "Food", "Hobbies", "Transport").
6. Determine the overall difficulty level of this question block ('Easy', 'Medium', or 'Hard').
7. Provide a list of 'contextTags' describing elements of the image (e.g. ["bedroom", "cat", "animals", "sleeping", "boy"]).
8. Generate a dynamic list of interactive sub-questions (questions array) for this image/context:
   - Determine how many questions are appropriate based on the image detail and the teacher's wishes (usually between 3 and 8 questions). If the teacher specified a desired number of questions, obey it!
   - For each sub-question:
     - Provide a professional, friendly, child-appropriate 'examinerScript' (what the AI examiner will ask the student in English). Keep sentences simple.
     - Determine 'expectedKeywords' (the critical English vocabulary the child is expected to say in response).
     - Determine 'targetGrammar' structures (e.g., ["present continuous", "prepositions", "there is", "there are"]).
     - Add 'topic' (use the main topic or specific sub-topic).
     - Add 'level' (use the main level).
     - Add 'difficulty' ('Easy', 'Medium', or 'Hard' depending on the progression of questions).
     - Generate a 'groupCode': a group identifier representing the category of the question (e.g. "1.1" for vocabulary assessment, "1.2" for grammar structure, "2.1" for speaking reflexes, "2.2" for storytelling details).
     - Generate a 'groupName': the name of the skill/category (e.g. "Vocabulary & Pronunciation", "Grammar & Sentence Structure", "Interactive Speaking Reflexes", "Linguistic Description").

You MUST respond strictly in the following JSON format:
{
  "id": "ST_P1_XY or MV_P3_XY or FL_P2_XY",
  "level": "Starters" | "Movers" | "Flyers",
  "part": number (1 to 5),
  "type": "Scene_Description" | "Object_Card" | "Storytelling" | "Find_Differences",
  "topic": "string",
  "difficulty": "Easy" | "Medium" | "Hard",
  "contextTags": ["tag1", "tag2", "tag3"],
  "questions": [
    {
      "examinerScript": "Examiner question in English",
      "expectedKeywords": ["keyword1", "keyword2"],
      "targetGrammar": ["grammar1"],
      "topic": "string",
      "level": "Starters" | "Movers" | "Flyers",
      "difficulty": "Easy" | "Medium" | "Hard",
      "groupCode": "string",
      "groupName": "string"
    }
  ]
}`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: geminiPrompt
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image
              }
            }
          ]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json"
      }
    };

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(geminiPayload)
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
    }

    const geminiData = await geminiResponse.json();
    const aiResponseContent = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!aiResponseContent) {
      throw new Error("Gemini Vision trả về phản hồi rỗng.");
    }

    console.log("✅ [AI Auto-Digitalizer] Phân tích Gemini hoàn tất:", aiResponseContent);
    const parsedData = JSON.parse(aiResponseContent);

    // Keep backwards compatibility for old components by copying the first sub-question to the top level
    if (parsedData.questions && parsedData.questions.length > 0) {
      parsedData.examinerScript = parsedData.questions[0].examinerScript;
      parsedData.expectedKeywords = parsedData.questions[0].expectedKeywords;
      parsedData.targetGrammar = parsedData.questions[0].targetGrammar;
    } else {
      parsedData.questions = [];
      parsedData.examinerScript = "";
      parsedData.expectedKeywords = [];
      parsedData.targetGrammar = [];
    }
    if (!parsedData.topic) {
      parsedData.topic = "General";
    }
    if (!parsedData.difficulty) {
      parsedData.difficulty = "Medium";
    }

    // Populate sub-question fields
    // Connect to database and fetch skill groups dynamically
    const { isFallback } = await connectToDatabase();
    let dbSkillGroups: any[] = [];
    if (isFallback) {
      dbSkillGroups = inMemorySkillGroups;
    } else {
      try {
        dbSkillGroups = await SkillGroup.find({});
        if (dbSkillGroups.length === 0) {
          const DEFAULT_GROUPS = [
            { code: "1.1", name: "Vocabulary & Pronunciation", description: "Từ vựng & Phát âm" },
            { code: "1.2", name: "Grammar & Sentence Structure", description: "Ngữ pháp & Cấu trúc" },
            { code: "2.1", name: "Speaking Reflexes", description: "Phản xạ nói" },
            { code: "2.2", name: "Storytelling & Description", description: "Kể chuyện & Miêu tả" }
          ];
          await SkillGroup.insertMany(DEFAULT_GROUPS);
          dbSkillGroups = await SkillGroup.find({});
        }
      } catch (err) {
        console.error("Error fetching skill groups for analyze post-processing:", err);
        dbSkillGroups = [
          { code: "1.1", name: "Vocabulary & Pronunciation" },
          { code: "1.2", name: "Grammar & Sentence Structure" },
          { code: "2.1", name: "Speaking Reflexes" },
          { code: "2.2", name: "Storytelling & Description" }
        ];
      }
    }

    const skillGroupsMap: Record<string, string> = {};
    dbSkillGroups.forEach((g: any) => {
      skillGroupsMap[g.code] = g.name;
    });

    // Populate sub-question fields
    if (parsedData.questions && parsedData.questions.length > 0) {
      parsedData.questions.forEach((q: any, idx: number) => {
        if (!q.topic) q.topic = parsedData.topic;
        if (!q.level) q.level = parsedData.level || "Starters";
        if (!q.difficulty) {
          q.difficulty = idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard";
        }

        if (q.groupCode && skillGroupsMap[q.groupCode]) {
          q.groupName = skillGroupsMap[q.groupCode];
        } else if (q.groupName) {
          const lowerName = q.groupName.toLowerCase();
          const matchedGroup = dbSkillGroups.find((g: any) => 
            lowerName.includes(g.name.toLowerCase()) || g.name.toLowerCase().includes(lowerName)
          );
          if (matchedGroup) {
            q.groupCode = matchedGroup.code;
            q.groupName = matchedGroup.name;
          }
        }

        if (!q.groupCode) {
          const codes = Object.keys(skillGroupsMap);
          if (codes.length > 0) {
            q.groupCode = idx < 2 ? codes[0] : idx < 4 && codes.length > 1 ? codes[1] : codes[2] || codes[0];
          } else {
            q.groupCode = "1.1";
          }
        }
        if (!q.groupName) {
          q.groupName = skillGroupsMap[q.groupCode] || "Vocabulary & Pronunciation";
        }
      });
    }

    // Ensure the generated ID is unique
    let baseId = parsedData.id || "ST_P1_01";
    baseId = baseId.trim().toUpperCase();

    let finalId = baseId;
    let exists = true;
    let counter = 1;

    while (exists) {
      if (!isFallback) {
        const found = await Question.findOne({ id: finalId });
        if (found) {
          const match = finalId.match(/^(.*?)_(\d+)$/);
          if (match) {
            const prefix = match[1];
            const num = parseInt(match[2], 10);
            finalId = `${prefix}_${num + 1}`;
          } else {
            finalId = `${finalId}_${counter}`;
            counter++;
          }
        } else {
          exists = false;
        }
      } else {
        const found = inMemoryQuestions.find((q) => q.id === finalId);
        if (found) {
          const match = finalId.match(/^(.*?)_(\d+)$/);
          if (match) {
            const prefix = match[1];
            const num = parseInt(match[2], 10);
            finalId = `${prefix}_${num + 1}`;
          } else {
            finalId = `${finalId}_${counter}`;
            counter++;
          }
        } else {
          exists = false;
        }
      }
    }

    parsedData.id = finalId;

    return NextResponse.json({
      success: true,
      data: parsedData,
    });

  } catch (error: any) {
    console.error("❌ Lỗi API POST questions/analyze:", error);
    return NextResponse.json(
      { error: "Không thể phân tích ảnh tự động bằng AI: " + error.message },
      { status: 500 }
    );
  }
}

