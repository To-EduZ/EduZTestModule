import OpenAI from "openai";
import { IAdaptiveSession } from "@/models/AdaptiveSession";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const file = new File([new Uint8Array(audioBuffer)], "audio.webm", { type: "audio/webm" });
  const transcription = await groq.audio.transcriptions.create({
    model: "whisper-large-v3",
    file: file,
    language: "en",
  });
  return (transcription.text || "").trim();
}

export async function gradeWriting(
  prompt: string,
  userAnswer: string,
  level: string
): Promise<{ score: number; isCorrect: boolean }> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `You are an English grader for kids.
Target sentence: "${prompt}"
User wrote: "${userAnswer}"
Return JSON with 'score' (0-100) and 'isCorrect' (true if score > 75). Only output JSON: {"score": 90, "isCorrect": true}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 100,
    });
    
    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return {
      score: Number(parsed.score) || 0,
      isCorrect: Boolean(parsed.isCorrect),
    };
  } catch (err) {
    const cleanUser = userAnswer.toLowerCase().replace(/[^a-z]/g, "");
    const cleanPrompt = prompt.toLowerCase().replace(/[^a-z]/g, "");
    const score = cleanUser === cleanPrompt ? 100 : (cleanUser.length > 3 ? 50 : 0);
    return { score, isCorrect: score > 75 };
  }
}

export async function generateParentRecommendation(sessionData: Partial<IAdaptiveSession>): Promise<string> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia giáo dục phân tích kết quả bài test Tiếng Anh của bé. 
Dữ liệu phiên thi:
- Điểm trung bình tổng: ${sessionData.finalScores?.overall || 0}/100
- Cấp độ xác định: ${sessionData.finalLevel}
- Từ vựng: ${sessionData.finalScores?.vocabulary || 0}
- Ngữ pháp: ${sessionData.finalScores?.grammar || 0}
- Luyện nói: ${sessionData.finalScores?.pronunciation || 0}
- Luyện nghe: ${sessionData.finalScores?.fluency || 0}

Hãy viết 1 đoạn văn (khoảng 4-5 câu) nhận xét dành cho phụ huynh bằng Tiếng Việt.
Khen ngợi điểm mạnh, chỉ ra điểm cần cải thiện, và đề xuất cách học tiếp theo.
Dùng emoji thân thiện. Output json: {"recommendation": "..."}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 400,
    });
    
    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    return parsed.recommendation || "Bé đã hoàn thành xuất sắc bài kiểm tra năng lực! 🎉";
  } catch (err) {
    return "Bé đã có cố gắng rất nhiều trong bài kiểm tra hôm nay. Ba mẹ hãy tiếp tục động viên bé nhé! 🌟";
  }
}

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
  // 1. Math aggregate fallback structure
  const total = assessments.length;
  let sSum = 0, sCount = 0;
  let lSum = 0, lCount = 0;
  let rSum = 0, rCount = 0;
  let wSum = 0, wCount = 0;

  assessments.forEach((a) => {
    const s = a.skill || "Speaking";
    if (s === "Speaking") { sSum += a.score; sCount++; }
    else if (s === "Listening") { lSum += a.score; lCount++; }
    else if (s === "Reading") { rSum += a.score; rCount++; }
    else if (s === "Writing") { wSum += a.score; wCount++; }
  });

  const avgSpeaking = sCount > 0 ? Math.round(sSum / sCount) : 75;
  const avgListening = lCount > 0 ? Math.round(lSum / lCount) : 70;
  const avgReading = rCount > 0 ? Math.round(rSum / rCount) : 65;
  const avgWriting = wCount > 0 ? Math.round(wSum / wCount) : 60;

  // Reflexes: based on overall speed/performance, Focus: based on number of tasks completed
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
    summary: `Bé đã hoàn thành ${total} hoạt động học tập Tiếng Anh. Bé có tiềm năng ngôn ngữ rất lớn, đặc biệt vượt trội ở kỹ năng nói với điểm trung bình ${avgSpeaking}/100. Bé thể hiện phản xạ nghe hiểu nhanh nhạy nhưng cần thực hành gõ từ vựng và củng cố ngữ pháp viết câu nhiều hơn.`,
    strengths: [
      `Phát âm tốt (${avgSpeaking}/100) và tự tin nói các câu tiếng Anh.`,
      `Nghe hiểu tốt các từ vựng chủ đề động vật, trường học.`
    ],
    weaknesses: [
      `Còn viết sai chính tả một số từ vựng phức tạp.`,
      `Đôi khi quên âm cuối (ending sounds) khi nói nhanh.`
    ],
    recommendation: "Ba mẹ nên khuyến khích bé nghe truyện ngắn hàng ngày, tập viết lại các từ vựng thông qua hình ảnh sinh động và chơi trò chơi nhại giọng AI để củng cố phản xạ tự nhiên."
  };

  try {
    // 2. Query Mistral for deep cognitive linguistic analysis
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `Bạn là chuyên gia giáo dục nhi đồng phân tích lịch sử học Tiếng Anh của bé. 
Dữ liệu lịch sử luyện tập (${total} bài làm):
${JSON.stringify(
  assessments.map(a => ({
    skill: a.skill,
    level: a.level,
    score: a.score,
    stars: a.stars,
    errorsCount: a.mispronouncedWords?.length || 0,
    date: a.createdAt,
  })).slice(0, 15) // Limit history to prevent token overflow
)}

Hãy đánh giá sự phát triển ngôn ngữ của bé qua 6 trục điểm (0-100):
1. speaking (Phát âm & Nói)
2. listening (Nghe hiểu)
3. reading (Từ vựng & Đọc)
4. writing (Ngữ pháp & Viết)
5. reflexes (Phản xạ & Tương tác)
6. focus (Tập trung & Chuyên cần - tính dựa trên số lượng bài làm ${total})

Hãy viết nhận xét sâu sắc dành cho phụ huynh bằng Tiếng Việt.
Định dạng JSON output chính xác:
{
  "scores": {
    "speaking": number,
    "listening": number,
    "reading": number,
    "writing": number,
    "reflexes": number,
    "focus": number
  },
  "summary": "Mô tả ngắn gọn về trình độ & khả năng tiếp thu hiện tại của bé (4-5 câu)...",
  "strengths": ["Điểm mạnh 1", "Điểm mạnh 2"],
  "weaknesses": ["Điểm yếu 1", "Điểm yếu 2"],
  "recommendation": "Đề xuất lộ trình học và rèn luyện cụ thể..."
}`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 600,
    });

    const content = completion.choices[0].message.content || "{}";
    const parsed = JSON.parse(content);
    
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
