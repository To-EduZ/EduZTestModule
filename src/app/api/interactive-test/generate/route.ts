import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import AppConfig from "@/models/AppConfig";
import TestPaper from "@/models/TestPaper";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

const fallbackQuestions = [
  {
    id: "MV_P1_57",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/v1782384803/hubxanh_yle_pdf_digitalizer/MV_P1_57_1782384801316.jpg",
    evaluationCriteria: {
      expectedKeywords: ["weather", "raining", "rainy", "clouds", "sunny", "sun", "blue sky"],
    },
  },
  {
    id: "MV_P1_87",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/v1782385222/hubxanh_yle_pdf_digitalizer/MV_P1_87_1782385217272.jpg",
    evaluationCriteria: {
      expectedKeywords: ["cat", "dog", "sleeping", "sofa"],
    },
  },
  {
    id: "ST_P1_43",
    level: "Movers",
    imagePath:
      "https://res.cloudinary.com/dupquwf3j/image/upload/v1779977776/hubxanh_yle_pdf_digitalizer/ST_P1_43_1779977774734.jpg",
    evaluationCriteria: {
      expectedKeywords: ["frog", "mushroom", "pink"],
    },
  },
];

export async function GET(req: NextRequest) {
  const developMode = req.headers.get("x-develop-mode") === "true";
  const { searchParams } = new URL(req.url);
  const paperId = searchParams.get("paperId");
  const testCodeParam = searchParams.get("testCode");
  
  let selectedPictures: any[] = [];
  try {
    let picQuestions: any[] = [];

    // 1. Get Questions based on TestPaper Delivery System
    const { isFallback } = await connectToDatabase();
    if (!isFallback) {
      try {
        let config = await AppConfig.findOne({ singletonId: "global_config" }).lean();
        if (!config) {
          config = await AppConfig.create({
            singletonId: "global_config",
            interactiveMode: "random",
            interactiveFixedTestId: "",
          });
        }

        const mode = config.interactiveMode;
        const fixedId = config.interactiveFixedTestId;
        let targetPaper = null;

        if (testCodeParam) {
          targetPaper = await TestPaper.findOne({ testCode: testCodeParam, moduleType: "interactive" }).lean();
        } else if (paperId) {
          targetPaper = await TestPaper.findOne({ id: paperId, moduleType: "interactive" }).lean();
        } else if (mode === "fixed" && fixedId) {
          targetPaper = await TestPaper.findOne({ id: fixedId, moduleType: "interactive" }).lean();
        } else {
          const publishedPapers = await TestPaper.find({ moduleType: "interactive", status: "published" }).lean();
          if (publishedPapers.length > 0) {
            const randomIndex = Math.floor(Math.random() * publishedPapers.length);
            targetPaper = publishedPapers[randomIndex];
          }
        }

        let dbQuestions = null;
        let pictureSection = null;

        if (targetPaper && targetPaper.sections && targetPaper.sections.length > 0) {
          pictureSection = targetPaper.sections.find((s: any) => s.type === "picture");
          const picQuestionIds = pictureSection?.questionIds || [];
          if (picQuestionIds.length > 0) {
            dbQuestions = await Question.find({ id: { $in: picQuestionIds }, imagePath: { $exists: true, $ne: "" } });
          }
        }

        // Backward compatibility fallback
        if (!dbQuestions) {
          const qIds = targetPaper?.questionIds || [];
          if (qIds.length > 0) {
            dbQuestions = await Question.find({ id: { $in: qIds }, imagePath: { $exists: true, $ne: "" } });
          } else {
            dbQuestions = await Question.find({ imagePath: { $exists: true, $ne: "" } });
          }
        }

        if (dbQuestions && dbQuestions.length > 0) {
          picQuestions = dbQuestions;
        }
      } catch (dbErr) {
        console.warn("⚠️ Không thể query collections trên MongoDB. Sử dụng bộ câu hỏi tĩnh dự phòng.", dbErr);
      }
    }

    if (picQuestions.length === 0) {
      picQuestions = fallbackQuestions;
    }

    // 2. Determine picture count from targetPaper picture section config (default: 2)
    let picCount = 2;
    let targetPaperForConfig = null;

    if (testCodeParam) {
      targetPaperForConfig = await TestPaper.findOne({ testCode: testCodeParam, moduleType: "interactive" }).lean();
    } else if (paperId) {
      targetPaperForConfig = await TestPaper.findOne({ id: paperId, moduleType: "interactive" }).lean();
    } else {
      let config = await AppConfig.findOne({ singletonId: "global_config" }).lean();
      const fixedId = config?.interactiveFixedTestId;
      if (config?.interactiveMode === "fixed" && fixedId) {
        targetPaperForConfig = await TestPaper.findOne({ id: fixedId, moduleType: "interactive" }).lean();
      }
    }

    if (targetPaperForConfig && targetPaperForConfig.sections) {
      const pictureSection = targetPaperForConfig.sections.find((s: any) => s.type === "picture");
      if (pictureSection?.config?.picCount !== undefined) {
        picCount = Number(pictureSection.config.picCount);
      }
    }

    const descQuestions = picQuestions.filter(q => q.type !== "Find_Differences");
    const diffQuestions = picQuestions.filter(q => q.type === "Find_Differences");
    
    if (picCount === 1) {
      // Pick 1 description picture
      if (descQuestions.length > 0) {
        selectedPictures.push(descQuestions[Math.floor(Math.random() * descQuestions.length)]);
      } else if (picQuestions.length > 0) {
        selectedPictures.push(picQuestions[Math.floor(Math.random() * picQuestions.length)]);
      }
    } else {
      // Pick description picture (first)
      if (descQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * descQuestions.length);
        selectedPictures.push(descQuestions[randomIndex]);
      }
      
      // Pick find differences picture (second)
      if (diffQuestions.length > 0) {
        const randomIndex = Math.floor(Math.random() * diffQuestions.length);
        selectedPictures.push(diffQuestions[randomIndex]);
      }
      
      // If we still need pictures to make it exactly picCount, fill from remaining general pool
      if (selectedPictures.length < picCount) {
        const remainingPool = picQuestions.filter(q => !selectedPictures.some(p => p.id === q.id));
        const shuffled = [...remainingPool].sort(() => 0.5 - Math.random());
        while (selectedPictures.length < picCount && shuffled.length > 0) {
          selectedPictures.push(shuffled.pop());
        }
      }
    }

    // 3. Extract keywords
    const keywordsList = selectedPictures.map(p => p?.evaluationCriteria?.expectedKeywords || []);
    const themeWords = Array.from(new Set(keywordsList.flat()));
    if (themeWords.length === 0) themeWords.push("animal", "nature");

    console.log(
      `🤖 [Generator API] Đang sinh đề thi tương tác AI theo từ khóa: [${themeWords.join(", ")}]`
    );

    // Get prompt override if present in reading section configuration
    let storyPrompt = "Câu chuyện đọc hiểu ngắn (40-50 từ), văn phong ngộ nghĩnh, cấu trúc đơn giản dễ thương, tự nhiên liên kết các chủ đề tranh.";
    if (targetPaperForConfig && targetPaperForConfig.sections) {
      const readingSection = targetPaperForConfig.sections.find((s: any) => s.type === "reading");
      if (readingSection?.config?.aiPromptOverride) {
        storyPrompt = readingSection.config.aiPromptOverride;
      }
    }

    // 4. Generate with Gemini
    let parsed: any;
    try {
      const content = await callGemini(
        [
          {
            role: "system",
            content: `Bạn là chuyên gia thiết kế đề thi tiếng Anh trẻ em cực kỳ chuyên nghiệp và sáng tạo.
Thiết kế một bộ đề thi động hoàn toàn bằng Tiếng Anh, phù hợp với trình độ Movers (A1), liên kết chủ đề các bức tranh có các từ khóa: [${themeWords.join(", ")}].

Yêu cầu từng thành phần:
1. story: ${storyPrompt}
2. mcq: Một câu hỏi trắc nghiệm MCQ dựa trên câu chuyện với 3 đáp án (1 đúng hoàn toàn), kèm emoji sinh động.
3. spelling: Hai từ vựng để bé đánh vần, liên quan đến câu chuyện hoặc tranh.
   - Mỗi từ có câu gợi ý bằng tiếng Anh dạng câu đố dễ thương, KHÔNG ĐƯỢC chứa từ cần đánh vần trong câu gợi ý.

BẮT BUỘC trả về JSON CHÍNH XÁC.
Lưu ý quan trọng về JSON:
- Tuyệt đối KHÔNG sử dụng dấu nháy kép (") bên trong nội dung các chuỗi văn bản (ví dụ như hội thoại trong truyện hoặc câu hỏi). Nếu cần dùng trích dẫn hoặc hội thoại, hãy dùng dấu nháy đơn (') hoặc escape dấu nháy kép thành \\".
- Không thêm bất kỳ văn bản giải thích nào ngoài khối JSON.

Định dạng JSON yêu cầu:
{
  "story": "Câu chuyện đọc hiểu tiếng Anh ngắn dễ thương...",
  "mcq": {
    "question": "Câu hỏi trắc nghiệm...",
    "options": ["Lựa chọn A...", "Lựa chọn B...", "Lựa chọn C..."],
    "correctIndex": 0
  },
  "spelling": [
    {"prompt": "Câu đố gợi ý từ thứ nhất (không chứa từ đó)...", "correctWord": "từ thứ nhất"},
    {"prompt": "Câu đố gợi ý từ thứ hai (không chứa từ đó)...", "correctWord": "từ thứ hai"}
  ]
}`,
          },
          {
            role: "user",
            content: `Từ khóa chủ đề các bức tranh: [${themeWords.join(", ")}]. Hãy sinh bộ đề thi độc quyền ngay lập tức!`,
          },
        ],
        { maxTokens: 1024, responseFormat: "json_object", temperature: 0.8, useAdaptiveModels: true }
      );

      parsed = safeJsonParse(content);
    } catch (geminiErr: any) {
      console.warn("⚠️ Lỗi gọi Gemini hoặc parse JSON đề thi. Sử dụng bộ đề thi tĩnh dự phòng.", geminiErr);
      
      const backupStory =
        "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";

      parsed = {
        story: backupStory,
        mcq: {
          question: "What does Max love to eat every morning?",
          options: ["Red apples 🍎", "Sweet yellow bananas 🍌", "Green leaves 🍃"],
          correctIndex: 1,
        },
        spelling: [
          {
            prompt: "Can you spell the word for the animal that lives in the tree? It starts with 'm'.",
            correctWord: "monkey",
          },
          {
            prompt: "Excellent! Now, can you spell the word for the yellow fruit that Max loves to eat? It starts with 'b'.",
            correctWord: "banana",
          },
        ]
      };
    }

    return NextResponse.json({
      success: true,
      pictures: selectedPictures,
      story: parsed.story,
      mcq: parsed.mcq,
      spelling: parsed.spelling,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API generate interactive-test hoàn toàn:", error);

    // Ultimate fallback if even database logic failed
    const backupStory =
      "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";

    return NextResponse.json({
      success: true,
      pictures: fallbackQuestions.slice(0, 2),
      story: backupStory,
      mcq: {
        question: "What does Max love to eat every morning?",
        options: ["Red apples 🍎", "Sweet yellow bananas 🍌", "Green leaves 🍃"],
        correctIndex: 1,
      },
      spelling: [
        {
          prompt: "Can you spell the word for the animal that lives in the tree? It starts with 'm'.",
          correctWord: "monkey",
        },
        {
          prompt: "Excellent! Now, can you spell the word for the yellow fruit that Max loves to eat? It starts with 'b'.",
          correctWord: "banana",
        },
      ],
    });
  }
}
