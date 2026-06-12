import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import OpenAI from "openai";

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

const fallbackQuestions = [
  {
    id: "ST_P1_01",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/demo/image/upload/v1312461204/sample.jpg",
    evaluationCriteria: {
      expectedKeywords: ["cat", "sleeping", "mat"]
    }
  },
  {
    id: "MV_P2_01",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/demo/image/upload/w_200,h_200,c_fill/v1312461204/sample.jpg",
    evaluationCriteria: {
      expectedKeywords: ["monkey", "climbing", "tree"]
    }
  },
  {
    id: "ST_P1_43",
    level: "Movers",
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/v1779977776/hubxanh_yle_pdf_digitalizer/ST_P1_43_1779977774734.jpg",
    evaluationCriteria: {
      expectedKeywords: ["frog", "mushroom", "pink"]
    }
  }
];

export async function GET(req: NextRequest) {
  try {
    let picQuestions: any[] = [];
    
    // 1. Attempt to load from MongoDB collect
    const { isFallback } = await connectToDatabase();
    if (!isFallback) {
      try {
        const dbQuestions = await Question.find({
          imagePath: { $exists: true, $ne: "" }
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

    // 2. Select 2 random pictures (ensure index range safety)
    const shuffled = [...picQuestions].sort(() => 0.5 - Math.random());
    const selectedPictures = shuffled.slice(0, 2);
    
    // Fallback duplication safety
    if (selectedPictures.length < 2) {
      selectedPictures.push(picQuestions[0]);
    }

    // 3. Extract keywords to weave
    const keywords1 = selectedPictures[0].evaluationCriteria?.expectedKeywords || ["animal"];
    const keywords2 = selectedPictures[1].evaluationCriteria?.expectedKeywords || ["nature"];
    
    const themeWords = Array.from(new Set([...keywords1, ...keywords2]));

    console.log(`🤖 [Generator API] Đang sinh đề thi tương tác AI theo các từ khóa chủ đề: [${themeWords.join(", ")}]`);

    // 4. Construct AI System Prompt
    const systemPrompt = `Bạn là chuyên gia thiết kế đề thi tiếng Anh trẻ em (Cambridge YLE examiner) cực kỳ chuyên nghiệp và sáng tạo.
Nhiệm vụ của bạn là nhận vào danh sách các từ khóa chủ đề của 2 bức ảnh chuẩn bị thi nói: [${themeWords.join(", ")}].
Hãy thiết kế một bộ đề thi động hoàn toàn bằng Tiếng Anh phù hợp với trình độ Movers (A1) gồm các thành phần sau:
1. Một câu chuyện đọc hiểu ngắn (tối đa 40-50 từ) có văn phong ngộ nghĩnh, cấu trúc đơn giản dễ thương liên kết hai chủ đề tranh ở trên lại với nhau một cách tự nhiên.
2. Một câu hỏi trắc nghiệm MCQ dựa trên câu chuyện trên, kèm 3 đáp án (trong đó có 1 đáp án đúng hoàn toàn). Đáp án cần có emoji tương ứng sinh động.
3. Hai từ vựng cần đánh vần ở Stage 4 liên quan đến câu chuyện hoặc các bức tranh trên (Ví dụ: 'monkey', 'banana', 'cat', 'tree', 'frog').
   - Đối với từng từ, cung cấp một câu gợi ý bằng tiếng Anh thật dễ thương dạng câu đố đố bé đánh vần mà KHÔNG ĐƯỢC CHỨA TỪ CẦN ĐÁNH VẦN ĐÓ TRONG CÂU GỢI Ý.

BẮT BUỘC TRẢ VỀ JSON VỚI ĐỊNH DẠNG CHÍNH XÁC SAU, KHÔNG THÊM BẤT KỲ GIẢI THÍCH NÀO BÊN NGOÀI:
{
  "story": "Câu chuyện đọc hiểu tiếng Anh ngắn dễ thương...",
  "mcq": {
    "question": "Câu hỏi trắc nghiệm dựa trên câu chuyện...",
    "options": ["Lựa chọn A...", "Lựa chọn B...", "Lựa chọn C..."],
    "correctIndex": 0 // Chỉ số 0, 1 hoặc 2 đại diện cho lựa chọn đúng hoàn toàn
  },
  "spelling": [
    {
      "prompt": "Câu đố gợi ý bé đánh vần từ thứ nhất (không chứa từ đó)...",
      "correctWord": "từ thứ nhất"
    },
    {
      "prompt": "Câu đố gợi ý bé đánh vần từ thứ hai (không chứa từ đó)...",
      "correctWord": "từ thứ hai"
    }
  ]
}`;

    // 5. Call Mistral AI to generate
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Hãy sinh bộ đề thi độc quyền chuẩn YLE ngay lập tức!" }
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Mistral trả về response rỗng");
    }

    const parsed = JSON.parse(content);

    return NextResponse.json({
      success: true,
      pictures: selectedPictures,
      story: parsed.story,
      mcq: parsed.mcq,
      spelling: parsed.spelling
    });

  } catch (error: any) {
    console.error("❌ Lỗi API generate interactive-test:", error);
    
    // Static backup response if Mistral/API is unavailable
    const backupStory = "Max is a happy little monkey who lives in a very tall coconut tree in the jungle. He loves to eat sweet yellow bananas every morning. Today, Max looks down and sees a small green frog sitting on a leaf in the pond. The frog is jumping up and down and singing a funny song. Max waves hello and laughs happily!";
    
    return NextResponse.json({
      success: true,
      pictures: fallbackQuestions.slice(0, 2),
      story: backupStory,
      mcq: {
        question: "What does Max love to eat every morning?",
        options: [
          "Red apples 🍎",
          "Sweet yellow bananas 🍌",
          "Green leaves 🍃"
        ],
        correctIndex: 1
      },
      spelling: [
        {
          prompt: "Can you spell the word for the animal that lives in the tree? It starts with 'm'.",
          correctWord: "monkey"
        },
        {
          prompt: "Excellent! Now, can you spell the word for the yellow fruit that Max loves to eat? It starts with 'b'.",
          correctWord: "banana"
        }
      ]
    });
  }
}
