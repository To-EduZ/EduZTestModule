import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import { questionBank } from "@/lib/questionBank";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

import { inMemoryAssessments } from "@/lib/dbStore";
const DEFAULT_USER_ID = "kid_primary_std_01";

interface ChoiceGrade {
  tutorComment: string;
  explanation: string;
  roadmap: string[];
}

// ─── AI Feedback Generator (Gemini) ──────────────────────────────────────────

async function generateChoiceFeedback(
  skill: string,
  prompt: string,
  questionText: string,
  correctOption: string,
  selectedOption: string,
  isCorrect: boolean
): Promise<ChoiceGrade> {
  try {
    const skillLabel = skill === "Listening" ? "Luyện Nghe" : "Luyện Đọc";
    const resultLabel = isCorrect ? "ĐÚNG HOÀN TOÀN 🎉" : "CHƯA ĐÚNG 😢";

    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là cô giáo dạy Tiếng Anh tiểu học cực kỳ vui vẻ, thân thiện và yêu thương trẻ con (6-11 tuổi).
Viết nhận xét và giải thích bài tập trắc nghiệm bằng Tiếng Việt, theo phong cách ấm áp, truyền cảm hứng.

Quy tắc:
- Nếu bé đúng: Khen thật nhiệt tình, giải thích tại sao đáp án đúng thật dễ hiểu.
- Nếu bé sai: An ủi nhẹ nhàng, KHÔNG chê bai; chỉ ra từ khóa quan trọng giúp bé hiểu tại sao đáp án đúng.
- Đề xuất đúng 3 bài tập nhỏ vui nhộn cụ thể, có emoji.
- Dùng nhiều emoji đáng yêu 🌟🎉🎈🦁🐒🦛.

Bắt buộc trả về JSON ĐÚNG cấu trúc, KHÔNG thêm text bên ngoài:
{
  "tutorComment": "Lời nhận xét động viên (tối đa 3 câu, kèm emoji)",
  "explanation": "Giải thích ngắn gọn, dễ hiểu bằng tiếng Việt",
  "roadmap": ["Bài tập nhỏ 1...", "Bài tập nhỏ 2...", "Bài tập nhỏ 3..."]
}`,
        },
        {
          role: "user",
          content: `Kỹ năng: ${skill} (${skillLabel})
Câu mẫu / Đoạn văn gốc: "${prompt}"
Câu hỏi phụ: "${questionText}"
Đáp án chuẩn: "${correctOption}"
Đáp án bé chọn: "${selectedOption}"
Kết quả: ${resultLabel}

Hãy viết nhận xét và giải thích cho bé nhé cô giáo AI!`,
        },
      ],
      { maxTokens: 500, responseFormat: "json_object" }
    );

    console.log("🤖 [Gemini Choice AI] Raw response:", content);
    const parsed = safeJsonParse<ChoiceGrade>(content);

    return {
      tutorComment:
        parsed.tutorComment ||
        (isCorrect
          ? "Tuyệt vời ông mặt trời! Bé xuất sắc lắm!"
          : "Cố gắng lên nào bé yêu, cô tin con làm được!"),
      explanation:
        parsed.explanation ||
        (isCorrect
          ? "Bé đã hiểu rất rõ nội dung bài học rồi đó!"
          : "Hãy chú ý nghe/đọc kỹ từ khóa quan trọng để chọn đúng nhé."),
      roadmap: Array.isArray(parsed.roadmap)
        ? parsed.roadmap.slice(0, 3)
        : [
            "Nghe lại audio mẫu hoặc đọc lại đoạn văn 3 lần 🎵",
            "Học thêm 3 từ vựng mới liên quan đến chủ đề 🦁",
            "Thử thách lại câu này để đạt trọn vẹn 5 sao vàng nhé ⭐",
          ],
    };
  } catch (err: any) {
    console.error("❌ Lỗi gọi Gemini AI chấm trắc nghiệm:", err.message);

    // Fallback static rules
    if (isCorrect) {
      return {
        tutorComment:
          "Wow! Con trả lời chính xác 100% luôn nè! Trí thông minh của con thật đáng nể! 🌟🐒",
        explanation: `Đúng rồi! Cụm từ khớp hoàn toàn với câu mẫu. Con đã chọn đáp án chuẩn xác là "${correctOption}".`,
        roadmap: [
          "Luyện phát âm to câu mẫu này 3 lần trôi chảy 🗣️",
          "Chơi ghép tranh ảnh từ vựng cùng ba mẹ 🎨",
          "Thử thách bản thân ở câu hỏi tiếp theo có độ khó cao hơn nhé 🏆",
        ],
      };
    } else {
      return {
        tutorComment:
          "Tiếc quá một chút xíu nữa thôi! Bé đã làm rất cố gắng rồi, đừng buồn con nhé! Cô tin lần sau con sẽ làm đúng. 🦛🎈",
        explanation: `Đáp án bé chọn "${selectedOption}" chưa khớp với nội dung. Hãy chú ý đọc/nghe kỹ từ khóa mô tả trong câu nhé.`,
        roadmap: [
          `Xem lại câu mẫu "${prompt}" và luyện dịch sang tiếng Việt 📘`,
          `Lắng nghe lại audio mẫu của cô giáo AI 3 lần thật tập trung 🎧`,
          `Bấm thử thách lại để chọn đáp án chuẩn "${correctOption}" và lấy 5 sao nhé 🌟`,
        ],
      };
    }
  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { level, skill, selectedOption } = body;

    if (!level || !skill || !selectedOption) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ thông tin: level, skill, selectedOption!" },
        { status: 400 }
      );
    }

    const question = questionBank[level]?.[skill.toLowerCase()];
    if (!question) {
      return NextResponse.json(
        { error: "Không tìm thấy câu hỏi tương ứng trong ngân hàng câu hỏi!" },
        { status: 404 }
      );
    }

    const isCorrect = selectedOption.trim() === question.correctOption?.trim();
    // YLE MCQ: binary scoring — no partial credit for wrong answers.
    // Honest score lets students and parents see clearly what needs work.
    const score = isCorrect ? 100 : 0;
    const stars = isCorrect ? 5 : 1;

    console.log(`🎮 Nhận chấm điểm trắc nghiệm ${skill}:`);
    console.log(`- Cấp độ: ${level}`);
    console.log(`- Câu hỏi: "${question.prompt}"`);
    console.log(`- Bé chọn: "${selectedOption}"`);
    console.log(`- Kết quả: ${isCorrect ? "ĐÚNG" : "SAI"}`);

    const grade = await generateChoiceFeedback(
      skill,
      question.prompt,
      question.questionText || "",
      question.correctOption || "",
      selectedOption,
      isCorrect
    );

    const assessmentData = {
      userId: DEFAULT_USER_ID,
      level,
      skill,
      sentence: question.prompt,
      spokenText: "",
      recordedAudioUrl: "",
      targetAnswer: question.correctOption,
      userAnswer: selectedOption,
      corrections: isCorrect ? "" : question.correctOption,
      score,
      stars,
      mispronouncedWords: isCorrect ? [] : [selectedOption],
      feedback: {
        tutorComment: grade.tutorComment,
        tips: grade.explanation,
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
        console.log(`💾 Lưu thành công bài trắc nghiệm vào MongoDB, ID: ${savedData._id}`);
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
      console.log(
        `💾 Đã lưu bài trắc nghiệm của bé vào BỘ NHỚ TẠM (FALLBACK), ID: ${savedData._id}`
      );
    }

    return NextResponse.json({
      success: true,
      score,
      stars,
      tutorComment: grade.tutorComment,
      explanation: grade.explanation,
      roadmap: grade.roadmap,
      savedId: savedData?._id?.toString() || null,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API assess-choice:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi chấm điểm bài trắc nghiệm: " + error.message },
      { status: 500 }
    );
  }
}
