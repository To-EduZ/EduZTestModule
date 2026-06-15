import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

const fallbackQuestions = [
  {
    id: "ST_P1_01",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    evaluationCriteria: {
      expectedKeywords: ["cat", "sleeping", "mat"],
    },
  },
  {
    id: "MV_P2_01",
    level: "Movers",
    imagePath:
      "https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1312461204/sample.jpg",
    evaluationCriteria: {
      expectedKeywords: ["monkey", "climbing", "tree"],
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
  try {
    let picQuestions: any[] = [];

    // 1. Attempt to load from MongoDB
    const { isFallback } = await connectToDatabase();
    if (!isFallback) {
      try {
        const dbQuestions = await Question.find({
          imagePath: { $exists: true, $ne: "" },
        });
        if (dbQuestions && dbQuestions.length > 0) {
          picQuestions = dbQuestions;
        }
      } catch (dbErr) {
        console.warn("⚠️ Không thể query collections trên MongoDB. Sử dụng bộ câu hỏi tĩnh dự phòng.");
      }
    }

    if (picQuestions.length === 0) {
      picQuestions = fallbackQuestions;
    }

    // 2. Select 2 random pictures
    const shuffled = [...picQuestions].sort(() => 0.5 - Math.random());
    const selectedPictures = shuffled.slice(0, 2);
    if (selectedPictures.length < 2) {
      selectedPictures.push(picQuestions[0]);
    }

    // 3. Extract keywords
    const keywords1 = selectedPictures[0].evaluationCriteria?.expectedKeywords || ["animal"];
    const keywords2 = selectedPictures[1].evaluationCriteria?.expectedKeywords || ["nature"];
    const themeWords = Array.from(new Set([...keywords1, ...keywords2]));

    console.log(
      `🤖 [Generator API] Đang sinh đề thi tương tác AI theo từ khóa: [${themeWords.join(", ")}]`
    );

    // 4. Generate with Gemini
    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là chuyên gia thiết kế đề thi tiếng Anh trẻ em (Cambridge YLE examiner) cực kỳ chuyên nghiệp và sáng tạo.
Thiết kế một bộ đề thi động hoàn toàn bằng Tiếng Anh, phù hợp với trình độ Movers (A1), liên kết chủ đề hai bức tranh có các từ khóa: [${themeWords.join(", ")}].

Yêu cầu từng thành phần:
1. story: Câu chuyện đọc hiểu ngắn (40-50 từ), văn phong ngộ nghĩnh, cấu trúc đơn giản dễ thương, tự nhiên liên kết hai chủ đề tranh.
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
          content: `Từ khóa chủ đề hai bức tranh: [${themeWords.join(", ")}]. Hãy sinh bộ đề thi độc quyền chuẩn YLE ngay lập tức!`,
        },
      ],
      { maxTokens: 1024, responseFormat: "json_object", temperature: 0.8 }
    );

    const parsed = safeJsonParse<{
      story: string;
      mcq: { question: string; options: string[]; correctIndex: number };
      spelling: { prompt: string; correctWord: string }[];
    }>(content);

    return NextResponse.json({
      success: true,
      pictures: selectedPictures,
      story: parsed.story,
      mcq: parsed.mcq,
      spelling: parsed.spelling,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API generate interactive-test:", error);

    // Static backup response if Gemini API is unavailable
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
