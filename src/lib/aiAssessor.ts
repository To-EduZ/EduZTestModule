import { callGemini, safeJsonParse } from "@/lib/geminiClient";
import { IAdaptiveSession } from "@/models/AdaptiveSession";
import OpenAI from "openai";

// Groq client is kept for Whisper audio transcription only
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

// ─── Audio Transcription (Groq Whisper) ──────────────────────────────────────

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });
  const transcription = await groq.audio.transcriptions.create({
    model: "whisper-large-v3",
    file: file,
    language: "en",
  });
  return (transcription.text || "").trim();
}

// ─── Writing Grader ───────────────────────────────────────────────────────────

export async function gradeWriting(
  prompt: string,
  userAnswer: string,
  level: string
): Promise<{ score: number; isCorrect: boolean }> {
  try {
    const content = await callGemini(
      [
        {
          role: "system",
          content: `You are a Cambridge YLE ${level} writing examiner. Score the student's answer honestly using YLE Writing Band Descriptors:
- Band 5 (85-100): Virtually no errors. Meaning crystal clear.
- Band 4 (65-84): Very few minor errors. Meaning completely clear. isCorrect = true from Band 4 up.
- Band 3 (45-64): Some errors but meaning generally clear.
- Band 2 (20-44): Many errors. Meaning sometimes unclear.
- Band 1 (0-19): Meaning very unclear. Major errors throughout.

Level calibration:
- Starters: Subject+verb+object expected. Minor article errors acceptable.
- Movers: Correct tenses required. Wrong tense = max Band 3.
- Flyers: Complex structures required. Wrong tense = max Band 2.

Target sentence: "${prompt}"

Return ONLY valid JSON: {"score": integer 0-100, "isCorrect": boolean (true if Band 4+, i.e. score >= 65)}`,
        },
        {
          role: "user",
          content: `Level: ${level} | Target: "${prompt}" | Student wrote: "${userAnswer}"`,
        },
      ],
      { maxTokens: 80, responseFormat: "json_object" }
    );

    const parsed = safeJsonParse<{ score: number; isCorrect: boolean }>(content);
    return {
      score: Number(parsed.score) || 0,
      isCorrect: Boolean(parsed.isCorrect),
    };
  } catch (err) {
    // Fallback: character overlap ratio → YLE band
    const cleanUser = userAnswer.toLowerCase().replace(/[^a-z]/g, "");
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z]/g, "");
    if (!cleanPrompt.length) return { score: 0, isCorrect: false };
    const overlapRatio = [...cleanUser].filter((c, i) => cleanPrompt[i] === c).length / cleanPrompt.length;
    const isPerfect = cleanUser === cleanPrompt;
    const score = isPerfect ? 92 : overlapRatio >= 0.85 ? 74 : overlapRatio >= 0.65 ? 54 : overlapRatio >= 0.40 ? 32 : 10;
    return { score, isCorrect: score >= 65 };
  }
}

// ─── Parent Recommendation Generator ─────────────────────────────────────────

export async function generateParentRecommendation(
  sessionData: Partial<IAdaptiveSession>
): Promise<string> {
  try {
    const overall = sessionData.finalScores?.overall || 0;
    const vocab = sessionData.finalScores?.vocabulary || 0;
    const grammar = sessionData.finalScores?.grammar || 0;
    const pronunciation = sessionData.finalScores?.pronunciation || 0;
    const fluency = sessionData.finalScores?.fluency || 0;

    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là chuyên gia giáo dục nhi đồng. Viết nhận xét ngắn gọn cho phụ huynh bằng tiếng Việt thân thiện, ấm áp (khoảng 4-5 câu).
Phân tích kết quả bài test Tiếng Anh của bé:
- Điểm tổng: ${overall}/100 | Cấp độ: ${sessionData.finalLevel}
- Từ vựng: ${vocab} | Ngữ pháp: ${grammar} | Phát âm: ${pronunciation} | Nghe: ${fluency}

Hãy: (1) Khen điểm mạnh nổi bật nhất, (2) Chỉ ra 1-2 điểm cần cải thiện, (3) Gợi ý cụ thể cách luyện tập ở nhà.
Dùng emoji thân thiện. Output JSON: {"recommendation": "nội dung nhận xét..."}`,
        },
      ],
      { maxTokens: 450, responseFormat: "json_object" }
    );

    const parsed = safeJsonParse<{ recommendation: string }>(content);
    return parsed.recommendation || "Bé đã hoàn thành xuất sắc bài kiểm tra năng lực! 🎉";
  } catch (err) {
    return "Bé đã có cố gắng rất nhiều trong bài kiểm tra hôm nay. Ba mẹ hãy tiếp tục động viên bé nhé! 🌟";
  }
}

// ─── Development Report Generator ────────────────────────────────────────────

export async function generateDevelopmentReport(assessments: any[]): Promise<{
  scores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
    reflexes: number;
    focus: number;
  };
  summary: string;
  strengths: string[];
  weaknesses: string[];
  recommendation: string;
}> {
  const total = assessments.length;

  // Aggregate scores per skill
  const skillBuckets: Record<string, number[]> = {
    Speaking: [],
    Listening: [],
    Reading: [],
    Writing: [],
  };

  assessments.forEach((a) => {
    const skill = a.skill || "Speaking";
    if (skillBuckets[skill] !== undefined) {
      skillBuckets[skill].push(a.score ?? 0);
    }
  });

  const avg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 70;

  const avgSpeaking = avg(skillBuckets.Speaking);
  const avgListening = avg(skillBuckets.Listening);
  const avgReading = avg(skillBuckets.Reading);
  const avgWriting = avg(skillBuckets.Writing);
  const calculatedReflexes = Math.min(Math.round((avgSpeaking + avgListening) / 2 + 5), 100);
  const calculatedFocus = Math.min(60 + total * 4, 98);

  const fallbackReport = {
    scores: {
      speaking: avgSpeaking,
      listening: avgListening,
      reading: avgReading,
      writing: avgWriting,
      reflexes: calculatedReflexes,
      focus: calculatedFocus,
    },
    summary: `Bé đã hoàn thành ${total} hoạt động học tập Tiếng Anh. Bé có tiềm năng ngôn ngữ rất lớn, đặc biệt vượt trội ở kỹ năng nói với điểm trung bình ${avgSpeaking}/100. Bé thể hiện phản xạ nghe hiểu nhanh nhạy nhưng cần thực hành từ vựng và củng cố ngữ pháp viết câu nhiều hơn.`,
    strengths: [
      `Phát âm tốt (${avgSpeaking}/100) và tự tin nói các câu tiếng Anh.`,
      `Nghe hiểu tốt các từ vựng chủ đề động vật và trường học.`,
    ],
    weaknesses: [
      `Còn viết sai chính tả một số từ vựng phức tạp.`,
      `Đôi khi quên âm cuối (ending sounds) khi nói nhanh.`,
    ],
    recommendation:
      "Ba mẹ nên khuyến khích bé nghe truyện ngắn hàng ngày, tập viết lại các từ vựng thông qua hình ảnh sinh động và chơi trò chơi nhại giọng AI để củng cố phản xạ tự nhiên.",
  };

  try {
    // Send only aggregated stats (not raw data) to avoid token overflow
    const statsPayload = {
      totalSessions: total,
      skillAverages: {
        Speaking: avgSpeaking,
        Listening: avgListening,
        Reading: avgReading,
        Writing: avgWriting,
      },
      recentLevels: Array.from(
        new Set(assessments.slice(0, 10).map((a) => a.level).filter(Boolean))
      ),
      recentSkillTrend: assessments.slice(0, 6).map((a) => ({
        skill: a.skill,
        score: a.score,
        stars: a.stars,
      })),
    };

    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là chuyên gia giáo dục nhi đồng phân tích lịch sử học Tiếng Anh của bé.
Dữ liệu thống kê tổng hợp (${total} buổi học):
${JSON.stringify(statsPayload)}

Đánh giá sự phát triển ngôn ngữ của bé qua 6 trục điểm (0-100):
1. speaking (Phát âm & Nói)
2. listening (Nghe hiểu)
3. reading (Từ vựng & Đọc)
4. writing (Ngữ pháp & Viết)
5. reflexes (Phản xạ & Tương tác) — tính từ tốc độ phản hồi trung bình
6. focus (Tập trung & Chuyên cần) — tính từ số buổi học: ${total}

Viết nhận xét sâu sắc cho phụ huynh bằng Tiếng Việt. Định dạng JSON chính xác:
{
  "scores": {"speaking": number, "listening": number, "reading": number, "writing": number, "reflexes": number, "focus": number},
  "summary": "Mô tả ngắn gọn 4-5 câu về trình độ & khả năng của bé...",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "recommendation": "Đề xuất lộ trình học cụ thể..."
}`,
        },
      ],
      { maxTokens: 700, responseFormat: "json_object" }
    );

    const parsed = safeJsonParse<typeof fallbackReport>(content);

    return {
      scores: {
        speaking: Number(parsed.scores?.speaking) || fallbackReport.scores.speaking,
        listening: Number(parsed.scores?.listening) || fallbackReport.scores.listening,
        reading: Number(parsed.scores?.reading) || fallbackReport.scores.reading,
        writing: Number(parsed.scores?.writing) || fallbackReport.scores.writing,
        reflexes: Number(parsed.scores?.reflexes) || fallbackReport.scores.reflexes,
        focus: Number(parsed.scores?.focus) || fallbackReport.scores.focus,
      },
      summary: parsed.summary || fallbackReport.summary,
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackReport.strengths,
      weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : fallbackReport.weaknesses,
      recommendation: parsed.recommendation || fallbackReport.recommendation,
    };
  } catch (err) {
    console.warn("⚠️ Lỗi phân tích AI, sử dụng thuật toán quy đổi tự động:", err);
    return fallbackReport;
  }
}
