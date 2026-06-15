import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

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

// ─── AI Writing Grader (Gemini) ───────────────────────────────────────────────

async function gradeWritingWithAI(
  level: string,
  prompt: string,
  userAnswer: string
): Promise<WritingGrade> {
  try {
    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là giám khảo Cambridge YLE có kinh nghiệm, đồng thời là giáo viên thân thiện với trẻ em (6-11 tuổi).
Chấm điểm bài viết Tiếng Anh theo chuẩn Cambridge YLE ${level} và phản hồi bằng Tiếng Việt.

NGUYÊN TẮC QUAN TRỌNG:
Phản ánh TRUNG THỰC trình độ của bé. Ba mẹ cần biết chính xác để hỗ trợ bé đúng cách. KHÔNG tự ý nâng điểm.

YLE WRITING BAND DESCRIPTORS — áp dụng nghiêm ngặt:
- Band 5 (85-100): Gần như không có lỗi. Ý nghĩa hoàn toàn rõ ràng. Đúng cấu trúc ngữ pháp.
- Band 4 (65-84): Rất ít lỗi nhỏ (1-2 lỗi nhỏ). Ý nghĩa hoàn toàn rõ. Dùng từ vựng phù hợp.
- Band 3 (45-64): Có một số lỗi nhưng ý nghĩa nhìn chung vẫn rõ. Từ vựng hạn chế.
- Band 2 (20-44): Nhiều lỗi. Ý nghĩa đôi khi không rõ. Ngữ pháp và từ vựng yếu.
- Band 1 (0-19): Ý nghĩa rất không rõ. Lỗi nghiêm trọng xuyên suốt. Từ vựng rất hạn chế.

Calibration theo cấp độ:
- Starters: Câu đơn giản (subject+verb+object). Lỗi article/plural nhỏ = tối đa giảm 1 band.
- Movers: Phải chia thì đúng (past simple, present continuous). Sai thì = tối đa Band 3.
- Flyers: Cần câu phức, thì phức (conditional/perfect). Sai thì hoàn toàn = tối đa Band 2.

Rubric chi tiết (áp dụng nội tâm):
- Spelling: 40% — mỗi từ sai chính tả trừ 5-10 điểm tùy độ sai
- Grammar: 30% — sai chia động từ hoặc cấu trúc trừ 8-15 điểm
- Meaning: 20% — câu khác nghĩa tương đương vẫn cho điểm cao
- Capitalization & Punctuation: 10% — thiếu trừ 3-5 điểm

Câu gợi ý: "${prompt}"

Bắt buộc trả về JSON ĐÚNG cấu trúc, KHÔNG thêm text bên ngoài:
{
  "score": number (0-100, phản ánh đúng band — KHÔNG nâng điểm),
  "stars": number (1-5: band5→5sao, band4→4sao, band3→3sao, band2→2sao, band1→1sao),
  "correctedText": "Câu tiếng Anh đã sửa hoàn chỉnh",
  "grammarFeedback": "Chỉ ra từng lỗi cụ thể bằng Tiếng Việt. Thân thiện nhưng CHÍNH XÁC. Khen ngợi nếu không có lỗi.",
  "tutorComment": "Nhận xét phản ánh đúng band YLE đạt được (tối đa 3 câu, kèm emoji). Nêu rõ band.",
  "roadmap": ["Bài tập cụ thể có mục tiêu rõ ràng 1...", "Bài tập 2...", "Bài tập 3..."]
}`,
        },
        {
          role: "user",
          content: `Cấp độ: ${level}
Câu gợi ý: "${prompt}"
Câu bé viết thực tế: "${userAnswer}"
Hãy chấm điểm trung thực theo YLE Band Descriptors và cho phản hồi cụ thể.`,
        },
      ],
      { maxTokens: 650, responseFormat: "json_object" }
    );


    console.log("🤖 [Gemini Writing AI] Raw response:", content);
    const parsed = safeJsonParse<WritingGrade>(content);

    return {
      score: Number(parsed.score) ?? 50,
      stars: Number(parsed.stars) ?? 3,
      correctedText: parsed.correctedText || prompt,
      grammarFeedback: parsed.grammarFeedback || "Hãy kiểm tra lại chính tả và ngữ pháp của câu.",
      tutorComment:
        parsed.tutorComment || "Cô đã chấm xong bài viết của con. Hãy xem nhận xét để cải thiện nhé! 📝",
      roadmap: Array.isArray(parsed.roadmap)
        ? parsed.roadmap.slice(0, 3)
        : [
            "Luyện chép lại câu mẫu 3 lần thật nắn nót ✍️",
            "Chụp ảnh bài viết và nhờ ba mẹ kiểm tra lỗi cùng 👨‍👩‍👧",
            "Viết lại câu sau khi đã sửa lỗi để gửi cho cô chấm lần 2 🏆",
          ],
    };
  } catch (err: any) {
    console.error("❌ Lỗi gọi Gemini AI chấm viết:", err.message);

    // Fallback: character-overlap scoring mapped to YLE band thresholds
    const cleanUser = userAnswer.toLowerCase().trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");
    const cleanPrompt = prompt.toLowerCase().trim()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "");

    const isPerfect = cleanUser === cleanPrompt;
    // Character-level overlap ratio for band estimation
    const overlapChars = [...cleanUser].filter((c, i) => cleanPrompt[i] === c).length;
    const overlapRatio = cleanPrompt.length > 0 ? overlapChars / cleanPrompt.length : 0;

    // Map overlap ratio to YLE bands
    let score: number;
    let stars: number;
    if (isPerfect)              { score = 92; stars = 5; }  // Band 5
    else if (overlapRatio >= 0.85) { score = 74; stars = 4; }  // Band 4
    else if (overlapRatio >= 0.65) { score = 54; stars = 3; }  // Band 3
    else if (overlapRatio >= 0.40) { score = 32; stars = 2; }  // Band 2
    else                        { score = 10; stars = 1; }  // Band 1

    return {
      score,
      stars,
      correctedText: prompt,
      grammarFeedback: isPerfect
        ? "Band 5: Con viết chính xác hoàn toàn! Không có lỗi nào cả. Xuất sắc! 🎉"
        : `Band ${stars}: Chú ý kiểm tra lại chính tả và ngữ pháp. Câu mẫu: "${prompt}"`,
      tutorComment: isPerfect
        ? "Distinction! Bé viết chuẩn Band 5 — không sai một chữ! Cô rất tự hào! 👑🎉"
        : stars >= 3
        ? `Pass (Band ${stars})! Bé viết được yêu cầu cơ bản. Hãy luyện thêm để lên Band ${stars + 1} nhé! 💪`
        : `Band ${stars} — Cần cải thiện đáng kể. Cô tin bé sẽ tiến bộ nếu luyện đều đặn! 💪`,
      roadmap: [
        `Luyện viết nắn nót câu mẫu 3 lần vào vở ✍️`,
        `Đọc to câu mẫu "${prompt}" 3 lần để ghi nhớ mặt chữ 🗣️`,
        `Viết lại câu sau khi đã luyện để nâng band nhé! 🏆`,
      ],
    };

  }
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

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

    const grade = await gradeWritingWithAI(level, prompt, userAnswer);

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
      mispronouncedWords: [],
      feedback: {
        tutorComment: grade.tutorComment,
        tips: grade.grammarFeedback,
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
