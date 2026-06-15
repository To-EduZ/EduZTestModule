import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import { callGemini, safeJsonParse } from "@/lib/geminiClient";

// Groq client for Whisper STT only
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

import { inMemoryAssessments } from "@/lib/dbStore";
const DEFAULT_USER_ID = "kid_primary_std_01";

// ─── Levenshtein Distance ─────────────────────────────────────────────────────
// Used for fuzzy phonetic matching to avoid penalizing near-correct pronunciations.
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

// Fuzzy phonetic match — strict: edit distance ≤ 1 for ALL word lengths.
// This accepts minor slips ("climing" → "climbing") but rejects clear misses.
function fuzzyWordMatch(spoken: string, target: string): boolean {
  if (spoken === target) return true;
  // Strict: only 1 edit distance allowed regardless of word length
  return levenshtein(spoken, target) <= 1;
}

// ─── YLE Multi-Criteria Speech Scorer ────────────────────────────────────────
//
// Based on Cambridge YLE 2023 Speaking Assessment Framework:
//   Criterion 1 — Phoneme Accuracy Rate  (PAR): 40% weight
//   Criterion 2 — Sentence Completion    (SCR): 30% weight  
//   Criterion 3 — Fluency Ratio          (FR):  20% weight
//   Criterion 4 — Level Calibration multiplier: applied to final score
//
// YLE Star bands (aligned with Cambridge Pass Thresholds):
//   5⭐ Distinction: ≥ 90  (well above standard)
//   4⭐ High Pass:   ≥ 75  (above standard)
//   3⭐ Pass:        ≥ 60  (meets Cambridge YLE minimum — this IS the goal)
//   2⭐ Near Miss:   ≥ 40  (needs targeted practice)
//   1⭐ Pre-thresh:  < 40  (substantial remediation needed)

const LEVEL_CALIBRATION: Record<string, number> = {
  Starters: 1.00,  // Basic level — full credit
  Movers:   0.95,  // Intermediate — slightly tighter expectations
  Flyers:   0.88,  // Advanced — clear articulation and accuracy required
};

function yleScoreSpeech(
  targetWords: string[],
  spokenWords: string[],
  level: string
): {
  score: number;
  stars: number;
  mispronouncedWords: string[];
  criteria: { par: number; scr: number; fr: number };
} {
  if (targetWords.length === 0) {
    return { score: 0, stars: 1, mispronouncedWords: [], criteria: { par: 0, scr: 0, fr: 0 } };
  }

  const tempSpoken = [...spokenWords];
  const mispronouncedWords: string[] = [];
  let exactMatches = 0;
  let fuzzyMatches = 0;

  for (const target of targetWords) {
    const exactIdx = tempSpoken.indexOf(target);
    if (exactIdx !== -1) {
      tempSpoken.splice(exactIdx, 1);
      exactMatches++;
      continue;
    }
    let fuzzied = false;
    for (let i = 0; i < tempSpoken.length; i++) {
      if (fuzzyWordMatch(tempSpoken[i], target)) {
        tempSpoken.splice(i, 1);
        fuzzyMatches++;
        fuzzied = true;
        break;
      }
    }
    if (!fuzzied) {
      mispronouncedWords.push(target);
    }
  }

  const totalWords = targetWords.length;
  const correctCount = exactMatches + fuzzyMatches;

  // Criterion 1: Phoneme Accuracy Rate — exact matches > fuzzy > miss
  // Exact = 1.0 credit, fuzzy = 0.75 credit (near-miss penalty)
  const par = (exactMatches * 1.0 + fuzzyMatches * 0.75) / totalWords;

  // Criterion 2: Sentence Completion Rate — did the student attempt every word?
  const attemptedCount = exactMatches + fuzzyMatches;
  const scr = attemptedCount / totalWords;

  // Criterion 3: Fluency Ratio — penalise excessive extra words or repetitions
  const fr = Math.min(spokenWords.length, totalWords) / totalWords;

  // Composite raw score
  const rawScore = (par * 0.40 + scr * 0.30 + fr * 0.20) * 100;

  // Apply level calibration
  const multiplier = LEVEL_CALIBRATION[level] ?? 1.0;
  const calibratedScore = Math.round(Math.min(rawScore * multiplier, 100));

  // YLE-aligned star scale
  let stars: number;
  if (calibratedScore >= 90) stars = 5;
  else if (calibratedScore >= 75) stars = 4;
  else if (calibratedScore >= 60) stars = 3;  // Cambridge YLE Pass threshold
  else if (calibratedScore >= 40) stars = 2;
  else stars = 1;

  return {
    score: calibratedScore,
    stars,
    mispronouncedWords,
    criteria: {
      par: Math.round(par * 100),
      scr: Math.round(scr * 100),
      fr: Math.round(fr * 100),
    },
  };
}

// ─── AI Feedback Generator (Gemini) ──────────────────────────────────────────

async function generateAIFeedback(
  sentence: string,
  spokenText: string,
  score: number,
  mispronouncedWords: string[],
  level: string,
  criteria: { par: number; scr: number; fr: number }
): Promise<{ tutorComment: string; tips: string; roadmap: string[] }> {
  try {
    const wrongList =
      mispronouncedWords.length > 0
        ? mispronouncedWords.join(", ")
        : "(không có — phát âm tốt!)";

    // Map score to YLE band label for AI context
    const yleBand =
      score >= 90 ? "Distinction (Xuất sắc)"
      : score >= 75 ? "High Pass (Đạt tốt)"
      : score >= 60 ? "Pass (Đạt chuẩn YLE tối thiểu)"
      : score >= 40 ? "Near Miss (Gần đạt — cần luyện thêm)"
      : "Pre-Threshold (Chưa đạt — cần cải thiện đáng kể)";

    const content = await callGemini(
      [
        {
          role: "system",
          content: `Bạn là giám khảo Cambridge YLE có kinh nghiệm, đồng thời là cô giáo thân thiện với trẻ em (6-11 tuổi).
Nhiệm vụ: Đánh giá bài nói Tiếng Anh theo chuẩn Cambridge YLE ${level} và viết nhận xét bằng Tiếng Việt.

NGUYÊN TẮC QUAN TRỌNG:
- Phản ánh TRUNG THỰC trình độ của bé theo chuẩn Cambridge — ba mẹ cần biết chính xác để hỗ trợ bé đúng cách.
- Điểm đã được tính toán khoa học theo 4 tiêu chí YLE: Phoneme Accuracy (${criteria.par}%), Sentence Completion (${criteria.scr}%), Fluency (${criteria.fr}%), Level Calibration (${level}).
- Bé đạt band: ${yleBand}
- Nếu bé chưa đạt chuẩn (dưới 60%), hãy nói thật nhưng nhẹ nhàng và CHỈ RA CỤ THỂ từ nào cần luyện.
- Nếu bé đạt chuẩn (từ 60% trở lên), khen ngợi thật lòng và gợi ý cải thiện thêm.
- Giọng văn ấm áp, dùng emoji, nhưng nhận xét PHẢI chính xác và không thổi phồng thành tích.

Bắt buộc trả về JSON ĐÚNG cấu trúc, KHÔNG thêm text bên ngoài:
{
  "tutorComment": "Nhận xét phản ánh đúng kết quả (tối đa 3 câu, kèm emoji)",
  "tips": "Hướng dẫn cụ thể để sửa lỗi phát âm (nếu có), hoặc gợi ý nâng cao (nếu đạt tốt)",
  "roadmap": ["Bài tập nhỏ có mục tiêu rõ ràng 1...", "Bài tập 2...", "Bài tập 3..."]
}`,
        },
        {
          role: "user",
          content: `Câu mục tiêu: "${sentence}"
Cấp độ: ${level} | Điểm: ${score}/100 | Band: ${yleBand}
Bé đã nói: "${spokenText}"
Từ phát âm không khớp: [${wrongList}]

Hãy viết nhận xét phản ánh đúng trình độ và lộ trình cụ thể.`,
        },
      ],
      { maxTokens: 520, responseFormat: "json_object" }
    );

    console.log("🤖 [Gemini AI Speech] Raw response:", content);
    const parsed = safeJsonParse<{ tutorComment: string; tips: string; roadmap: string[] }>(content);

    if (!parsed.tutorComment || !parsed.tips || !Array.isArray(parsed.roadmap)) {
      throw new Error("JSON response có cấu trúc không đúng");
    }

    return {
      tutorComment: parsed.tutorComment,
      tips: parsed.tips,
      roadmap: parsed.roadmap.slice(0, 3),
    };
  } catch (err: any) {
    console.error("❌ Lỗi gọi Gemini AI (speech):", err.message);
    return getFallbackFeedback(score, mispronouncedWords);
  }
}

// ─── Static Fallback Feedback (YLE Band aligned) ─────────────────────────────

function getFallbackFeedback(
  score: number,
  mispronouncedWords: string[]
): { tutorComment: string; tips: string; roadmap: string[] } {
  // Pre-Threshold: < 40 — or silent audio
  if (score < 40) {
    return {
      tutorComment:
        "Ồ! Cô chưa nghe rõ được giọng đọc của con. Con hãy bấm lại và nói to, rõ ràng vào sát Mic nhé! 🎤🎈",
      tips: "Hãy chắc chắn là Microphone đã được bật và nói thật to câu mẫu nhé.",
      roadmap: [
        "Kiểm tra Microphone đã bật chưa 🔌",
        "Nghe lại audio mẫu của cô giáo AI 3 lần trước khi đọc 🎵",
        "Bấm thử thách lại và nói thật to rõ từng chữ nhé 💪",
      ],
    };
  }
  // Distinction: ≥ 90
  if (score >= 90) {
    return {
      tutorComment:
        "Xuất sắc! Con phát âm đạt chuẩn Distinction Cambridge — giọng chuẩn, rõ ràng, trôi chảy! Cô rất tự hào! 🎉🦁",
      tips: "Con đã đạt band cao nhất. Hãy tiếp tục thử câu dài hơn hoặc cấp độ khó hơn!",
      roadmap: [
        "Thử câu dài hơn ở cấp độ tương đương để giữ phong độ ⭐",
        "Thu âm câu này gửi cho ba mẹ cùng tự hào 🎁",
        "Thử thách bản thân với cấp độ cao hơn (Movers → Flyers) 📚",
      ],
    };
  }
  // High Pass: 75-89
  if (score >= 75) {
    const wrongWords = mispronouncedWords.length > 0 ? mispronouncedWords.join(", ") : "một vài từ nhỏ";
    return {
      tutorComment:
        "High Pass! Con phát âm rất tốt — đạt trên chuẩn YLE. Sửa thêm một chút là Distinction luôn! 🌟🐒",
      tips: `Từ "${wrongWords}" con đọc gần đúng, hãy chú ý nhấn rõ âm đuôi (ending sound) và hơi thở.`,
      roadmap: [
        `Tập đọc chậm từng từ "${mispronouncedWords[0] || "từ khó"}" trước gương 3 lần 🪞`,
        "Luyện nhấn ending sounds: -s, -ed, -ing thật rõ 🌬️",
        "Đọc lại câu này để lên Distinction nhé! 🏆",
      ],
    };
  }
  // Pass: 60-74 (YLE minimum threshold)
  if (score >= 60) {
    const wrongWords = mispronouncedWords.length > 0 ? mispronouncedWords.join(", ") : "một số từ";
    return {
      tutorComment:
        "Pass! Con đã vượt qua ngưỡng tối thiểu Cambridge YLE 🎈 Hãy luyện thêm để lên High Pass nhé!",
      tips: `Cần cải thiện phát âm các từ: "${wrongWords}". Hãy nghe kỹ mẫu và tập nhại từng âm tiết.`,
      roadmap: [
        `Luyện phát âm từng âm tiết của "${mispronouncedWords[0] || "từ khó"}" theo mẫu AI 🎙️`,
        "Nghe audio mẫu và dừng lại ở từng từ khó, nhại theo 🔁",
        "Thử thách đọc lại toàn câu để nâng từ Pass lên High Pass 🌟",
      ],
    };
  }
  // Near Miss: 40-59
  const wrongWords = mispronouncedWords.length > 0 ? mispronouncedWords.join(", ") : "các từ khó";
  return {
    tutorComment:
      "Cô khen bé đã dũng cảm thử sức! Nhưng bé cần luyện thêm để đạt chuẩn Pass YLE (60%). Đừng nản nhé! 🦛🎈",
    tips: `Các từ "${wrongWords}" cần được luyện kỹ hơn — tập phát âm chậm từng âm tiết trước.`,
    roadmap: [
      `Luyện đọc chậm từng âm tiết "${mispronouncedWords[0] || "từ khó"}" cùng cô giáo AI 👩‍🏫`,
      `Nghe và nhại theo audio mẫu câu này ít nhất 5 lần 🐢`,
      "Bấm thử thách lại sau khi đã luyện — con sẽ tiến bộ rõ rệt 💪",
    ],
  };
}

// ─── POST Handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as File;
    const sentence = formData.get("sentence") as string;
    const level = formData.get("level") as string;

    if (!audioFile || !sentence) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ file âm thanh và câu cần đánh giá!" },
        { status: 400 }
      );
    }

    console.log(`🎙️ Nhận yêu cầu đánh giá âm thanh:`);
    console.log(`- File name: ${audioFile.name}`);
    console.log(`- Dung lượng: ${audioFile.size} bytes`);
    console.log(`- Câu đích: "${sentence}"`);
    console.log(`- Cấp độ: ${level}`);

    const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
    const audioSize = audioBuffer.length;

    // Short audio → likely didn't speak
    if (audioSize < 6000) {
      const targetWords = sentence
        .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean);
      const fallbackFeedback = getFallbackFeedback(0, targetWords);

      return NextResponse.json({
        success: true,
        sentence,
        spokenText: "",
        score: 0,
        stars: 1,
        mispronouncedWords: targetWords,
        feedback: {
          tutorComment: fallbackFeedback.tutorComment,
          tips: fallbackFeedback.tips,
        },
        roadmap: fallbackFeedback.roadmap,
      });
    }

    // 1. Transcribe with Groq Whisper
    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });
    const transcription = await groq.audio.transcriptions.create({
      model: "whisper-large-v3",
      file: file,
      language: "en",
    });
    const spokenText = (transcription.text || "").trim();
    console.log(`📝 [Groq Whisper] Transcribed text: "${spokenText}"`);

    // 2. Score with YLE multi-criteria algorithm
    const cleanedSentence = sentence
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .toLowerCase();
    const targetWords = cleanedSentence.split(/\s+/).filter(Boolean);

    const cleanedSpoken = spokenText
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "")
      .toLowerCase();
    const spokenWords = cleanedSpoken.split(/\s+/).filter(Boolean);

    const { score, stars, mispronouncedWords, criteria } = yleScoreSpeech(targetWords, spokenWords, level);
    console.log(`🎯 [YLE Scorer] Score: ${score}/100 | Stars: ${stars} | PAR: ${criteria.par}% | SCR: ${criteria.scr}% | FR: ${criteria.fr}% | Wrong: [${mispronouncedWords.join(", ")}]`);

    // 3. Generate AI feedback
    console.log(`🧠 [AI Feedback] Đang gọi Gemini AI sinh nhận xét...`);
    const aiFeedback = await generateAIFeedback(
      sentence,
      spokenText,
      score,
      mispronouncedWords,
      level,
      criteria
    );
    console.log(`✅ [AI Feedback] Nhận xét:`, aiFeedback);

    // 4. Save to database
    const assessmentData = {
      userId: DEFAULT_USER_ID,
      level,
      sentence,
      spokenText,
      score,
      stars,
      mispronouncedWords,
      feedback: {
        tutorComment: aiFeedback.tutorComment,
        tips: aiFeedback.tips,
      },
      roadmap: aiFeedback.roadmap,
      recordedAudioUrl: "",
      createdAt: new Date(),
    };

    let savedData: any = null;
    const { isFallback } = await connectToDatabase();

    if (!isFallback) {
      try {
        const newResult = new AssessmentResult(assessmentData);
        savedData = await newResult.save();
        console.log(`💾 Lưu thành công bài thi nói vào MongoDB, ID: ${savedData._id}`);
      } catch (dbError: any) {
        console.warn("⚠️ Không thể ghi dữ liệu vào MongoDB. Tự động lưu vào bộ nhớ tạm.", dbError.message);
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
      console.log(`💾 Đã lưu bài nói của bé vào BỘ NHỚ TẠM (FALLBACK), ID: ${savedData._id}`);
    }

    return NextResponse.json({
      success: true,
      sentence,
      spokenText,
      score,
      stars,
      mispronouncedWords,
      feedback: {
        tutorComment: aiFeedback.tutorComment,
        tips: aiFeedback.tips,
      },
      roadmap: aiFeedback.roadmap,
      savedId: savedData?._id?.toString() || null,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API assess-speech:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi chấm điểm phát âm: " + error.message },
      { status: 500 }
    );
  }
}
