import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

import { inMemoryAssessments } from "@/lib/dbStore";
const DEFAULT_USER_ID = "kid_primary_std_01";

interface WritingGrade {
  score: number;
  stars: number;
  correctedText: string;
  grammarFeedback: string;
  tutorComment: string;
  roadmap: string[];
}

async function gradeWritingWithAI(
  level: string,
  prompt: string,
  userAnswer: string
): Promise<WritingGrade> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `Bạn là cô giáo dạy Tiếng Anh tiểu học cực kỳ vui vẻ, thân thiện và giàu lòng yêu thương trẻ con (6-11 tuổi). 
Nhiệm vụ của bạn là nhận xét bài viết Tiếng Anh của học sinh bằng Tiếng Việt. 
Hãy động viên bé trước, khen ngợi sự cố gắng nỗ lực viết câu của bé.
Sau đó, hãy kiểm tra xem câu bé viết có đúng chính tả (spelling), đúng ngữ pháp cơ bản (grammar) hay không. So sánh với câu mẫu/gợi ý dưới đây: "${prompt}".
Nếu bé viết đúng hoàn toàn, hãy cho 100 điểm và 5 sao!
Nếu có lỗi chính tả, thiếu dấu câu, quên viết hoa chữ cái đầu câu, hoặc chia sai động từ, hãy sửa lại một câu hoàn chỉnh, đúng chuẩn ở trường "correctedText" và nhẹ nhàng nhắc nhở, giải thích bằng tiếng Việt thật dễ hiểu cho bé ở trường "grammarFeedback".
Đề xuất 3 bài tập nhỏ vui nhộn ở trường "roadmap" để bé rèn luyện tốt hơn.
Sử dụng nhiều emoji dễ thương 🌟🎉🎈🦁🐒🦛.

Bắt buộc trả về JSON ĐÚNG cấu trúc sau, KHÔNG thêm bất kỳ text giải thích nào bên ngoài JSON:
{
  "score": 100, // Điểm số từ 0 đến 100 (số nguyên)
  "stars": 5, // Số sao từ 1 đến 5 (số nguyên)
  "correctedText": "Câu tiếng Anh chuẩn xác sau khi đã sửa toàn bộ lỗi",
  "grammarFeedback": "Lời giải thích bằng Tiếng Việt dễ thương về các từ bé viết sai hoặc ngữ pháp chưa chuẩn",
  "tutorComment": "Lời nhận xét chung động viên tinh thần của con (tối đa 3 câu, kèm emoji)",
  "roadmap": ["Bài tập nhỏ 1 vui nhộn...", "Bài tập nhỏ 2...", "Bài tập nhỏ 3..."]
}`,
        },
        {
          role: "user",
          content: `Cấp độ: ${level}
Gợi ý đề bài: "${prompt}"
Câu bé viết thực tế: "${userAnswer}"
Hãy chấm điểm và cho ý kiến nhé cô giáo AI!`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Mistral trả về response rỗng");
    }

    console.log("🤖 [Mistral Writing AI] Raw response:", content);
    const parsed: WritingGrade = JSON.parse(content);

    return {
      score: Number(parsed.score) || 80,
      stars: Number(parsed.stars) || 4,
      correctedText: parsed.correctedText || prompt,
      grammarFeedback: parsed.grammarFeedback || "Con viết gần đúng rồi đấy!",
      tutorComment: parsed.tutorComment || "Cô khen ngợi tinh thần học tập tuyệt vời của con! 🌟",
      roadmap: Array.isArray(parsed.roadmap) ? parsed.roadmap.slice(0, 3) : [
        "Luyện chép lại câu mẫu 3 lần thật nắn nót ✍️",
        "Chơi trò chơi ghép từ vựng cùng ba mẹ 🎮",
        "Thử thách viết lại câu này để đạt điểm tối đa nhé! 🏆"
      ],
    };
  } catch (err: any) {
    console.error("❌ Lỗi gọi Mistral AI chấm viết:", err.message);
    
    // Fallback static evaluation if API is down
    const cleanUser = userAnswer.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const cleanPrompt = prompt.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    
    const isPerfect = cleanUser === cleanPrompt;
    const score = isPerfect ? 100 : cleanUser.length > 5 ? 75 : 30;
    const stars = isPerfect ? 5 : cleanUser.length > 5 ? 4 : 2;

    return {
      score,
      stars,
      correctedText: prompt,
      grammarFeedback: isPerfect 
        ? "Wow! Con viết cực kỳ chính xác, không sai một lỗi nhỏ nào luôn nè! Cô tự hào về con lắm!"
        : "Con đã viết rất cố gắng rồi! Chú ý xem lại chính tả các từ và nhớ viết hoa chữ cái đầu câu nhé bé yêu.",
      tutorComment: isPerfect
        ? "Tuyệt cú mèo! Bé viết siêu đỉnh, xứng đáng nhận huy hiệu Trạng Nguyên Tiếng Anh! 👑🎉"
        : "Cô khen bé đã rất dũng cảm hoàn thành bài viết của mình. Luyện tập thêm một chút là con sẽ đạt điểm tuyệt đối đấy! 🦁💪",
      roadmap: [
        `Luyện viết nắn nót từ khó trong câu này 3 lần vào vở học tập 📓`,
        `Đọc to câu mẫu "${prompt}" 3 lần để ghi nhớ mặt chữ và cách ghép câu 🗣️`,
        `Nhấp vào thử thách lại và viết lại câu thật chuẩn để dành trọn 5 sao vàng nhé 🌟`
      ]
    };
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, prompt, userAnswer } = body;

    if (!level || !prompt || userAnswer === undefined) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ thông tin: level, prompt, userAnswer!" },
        { status: 400 }
      );
    }

    console.log(`✍️ Nhận yêu cầu chấm điểm viết:`);
    console.log(`- Cấp độ: ${level}`);
    console.log(`- Prompt: "${prompt}"`);
    console.log(`- Câu viết của bé: "${userAnswer}"`);

    // AI grading engine
    const grade = await gradeWritingWithAI(level, prompt, userAnswer);

    // Save to Database
    const assessmentData = {
      userId: DEFAULT_USER_ID,
      level,
      skill: "Writing",
      sentence: prompt,
      spokenText: "",
      recordedAudioUrl: "",
      targetAnswer: prompt,
      userAnswer,
      corrections: grade.correctedText,
      score: grade.score,
      stars: grade.stars,
      mispronouncedWords: [], // Not applicable to writing
      feedback: {
        tutorComment: grade.tutorComment,
        tips: grade.grammarFeedback, // We map grammar explanations to 'tips' for visual rendering compatibility!
      },
      roadmap: grade.roadmap,
      createdAt: new Date(),
    };

    let savedData: any = null;
    const { isFallback } = await connectToDatabase();

    if (!isFallback) {
      try {
        const newResult = new AssessmentResult(assessmentData);
        savedData = await newResult.save();
        console.log(`💾 Lưu thành công bài viết vào MongoDB, ID: ${savedData._id}`);
      } catch (dbError: any) {
        console.warn("⚠️ Ghi MongoDB lỗi, tự động lưu bộ nhớ tạm.", dbError.message);
        savedData = {
          _id: `mem_${Math.random().toString(36).substr(2, 9)}`,
          ...assessmentData,
        };
        inMemoryAssessments.unshift(savedData);
      }
    } else {
      savedData = {
        _id: `mem_${Math.random().toString(36).substr(2, 9)}`,
        ...assessmentData,
      };
      inMemoryAssessments.unshift(savedData);
      console.log(`💾 Đã lưu bài viết của bé vào BỘ NHỚ TẠM (FALLBACK), ID: ${savedData._id}`);
    }

    return NextResponse.json({
      success: true,
      score: grade.score,
      stars: grade.stars,
      correctedText: grade.correctedText,
      grammarFeedback: grade.grammarFeedback,
      tutorComment: grade.tutorComment,
      roadmap: grade.roadmap,
      savedId: savedData?._id?.toString() || null,
    });

  } catch (error: any) {
    console.error("❌ Lỗi API assess-writing:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi chấm điểm bài viết: " + error.message },
      { status: 500 }
    );
  }
}
