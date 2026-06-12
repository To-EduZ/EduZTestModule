import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";

const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: "https://api.groq.com/openai/v1",
});

const mistral = new OpenAI({
  apiKey: process.env.MISTRAL_API_KEY,
  baseURL: "https://api.mistral.ai/v1",
});

import { inMemoryAssessments } from "@/lib/dbStore";
const DEFAULT_USER_ID = "kid_primary_std_01";

async function generateAIFeedback(
  sentence: string,
  spokenText: string,
  score: number,
  mispronouncedWords: string[],
  level: string
): Promise<{ tutorComment: string; tips: string; roadmap: string[] }> {
  try {
    const completion = await mistral.chat.completions.create({
      model: "mistral-small-latest",
      messages: [
        {
          role: "system",
          content: `Bạn là cô giáo dạy Tiếng Anh tiểu học cực kỳ vui vẻ, thân thiện và giàu lòng yêu thương trẻ con (6-11 tuổi). 
Nhiệm vụ của bạn là nhận xét bài nói của học sinh bằng Tiếng Việt. 
Hãy động viên bé trước, khen ngợi sự cố gắng, sau đó nhắc nhở nhẹ nhàng về các từ phát âm sai.
Cuối cùng, đề xuất 3 bài tập vui nhộn và siêu ngắn để bé sửa lỗi.
Dùng nhiều emoji dễ thương 🌟🎉🎈🦁🐒🦛.

Bắt buộc trả về JSON ĐÚNG cấu trúc sau, KHÔNG thêm bất kỳ text nào khác:
{
  "tutorComment": "Lời nhận xét động viên (tối đa 3 câu, kèm emoji)",
  "tips": "Cách luyện phát âm các từ bị sai cho bé (dễ hiểu, thân thiện)",
  "roadmap": ["Bài tập nhỏ 1 vui nhộn...", "Bài tập nhỏ 2...", "Bài tập nhỏ 3..."]
}`,
        },
        {
          role: "user",
          content: `Bé vừa đọc câu: "${sentence}"
Cấp độ: ${level}
Bé thực tế đã nói: "${spokenText}"
Điểm số: ${score}/100
Các từ bé phát âm sai: [${mispronouncedWords.join(", ")}]

Hãy tạo nhận xét và lộ trình cho bé.`,
        },
      ],
      response_format: { type: "json_object" },
      max_tokens: 500,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error("Mistral trả về response rỗng");
    }

    console.log("🤖 [Mistral AI] Raw response:", content);

    const parsed = JSON.parse(content);

    if (!parsed.tutorComment || !parsed.tips || !Array.isArray(parsed.roadmap)) {
      throw new Error("JSON response không đúng cấu trúc");
    }

    return {
      tutorComment: parsed.tutorComment,
      tips: parsed.tips,
      roadmap: parsed.roadmap.slice(0, 3),
    };
  } catch (err: any) {
    console.error("❌ Lỗi gọi Mistral AI:", err.message);
    return getFallbackFeedback(score, mispronouncedWords);
  }
}

function getFallbackFeedback(score: number, mispronouncedWords: string[]): { tutorComment: string; tips: string; roadmap: string[] } {
  if (score < 30) {
    return {
      tutorComment: "Ồ! Cô chưa nghe rõ được giọng đọc đáng yêu của con. Con hãy bấm nút 'Thử thách lại' và nói to, rõ ràng hơn vào sát Mic nhé! 🎤🎈",
      tips: "Hãy chắc chắn là con đã bấm nút cho phép sử dụng Microphone trên trình duyệt và nói thật to câu mẫu nhé.",
      roadmap: [
        "Kiểm tra lại Microphone của máy tính hoặc điện thoại xem đã được bật chưa 🔌",
        "Nghe lại audio mẫu của cô giáo AI 3 lần để làm quen giọng điệu 🎵",
        "Bấm thử thách lại và dũng cảm nói thật to rõ từng chữ nhé bé yêu 💪"
      ],
    };
  } else if (score >= 95) {
    return {
      tutorComment: "Wow! Con phát âm thật xuất sắc! Giọng của con siêu chuẩn và truyền cảm luôn đấy. Cô rất tự hào về con! 🎉🦁",
      tips: "Con đã làm rất tốt. Hãy tiếp tục duy trì phong độ này ở các câu tiếp theo nhé!",
      roadmap: [
        "Luyện tập thêm 1 câu dài hơn thuộc cấp độ này để nhận thêm sao nhé! ⭐",
        "Thu âm và gửi tặng ba mẹ nghe giọng đọc Tiếng Anh siêu đỉnh của con 🎁",
        "Thử thách bản thân bằng cách tự kể một câu chuyện ngắn bằng Tiếng Anh 📚"
      ],
    };
  } else if (score >= 70) {
    const wrongWords = mispronouncedWords.length > 0 ? mispronouncedWords.join(", ") : "một vài từ nhỏ";
    return {
      tutorComment: "Con làm tốt lắm! Phát âm rất rõ ràng và trôi chảy. Chỉ cần chú ý sửa một chút xíu lỗi nhỏ nữa là đạt 5 sao luôn nè! 🌟🐒",
      tips: `Từ "${wrongWords}" con đọc gần đúng rồi, chỉ cần chú ý nhấn rõ hơi hoặc bật âm đuôi (ending sound) rõ hơn nữa nhé.`,
      roadmap: [
        `Nghe lại từ mẫu "${mispronouncedWords[0] || "từ khó"}" và lặp lại 3 lần thật to trước gương 🪞`,
        `Chơi trò chơi 'Bật âm đuôi' - luyện đọc từ "${mispronouncedWords[0] || "từ khó"}" thật gió 🌬️`,
        `Thử thách đọc lại cả câu này lần thứ hai để chinh phục trọn vẹn 5 sao vàng 🏆`
      ],
    };
  } else {
    const wrongWords = mispronouncedWords.length > 0 ? mispronouncedWords.join(", ") : "các từ khó";
    return {
      tutorComment: "Cô khen ngợi tinh thần cố gắng tuyệt vời của con! Con đã rất dũng cảm khi nói Tiếng Anh thật to. Hãy cùng cô luyện tập thêm nhé! 🦛🎈",
      tips: `Hãy lắng nghe thật kỹ cách phát âm của các từ "${wrongWords}" và bật hơi mạnh hơn nhé bé yêu.`,
      roadmap: [
        `Luyện đọc chậm rãi từ "${mispronouncedWords[0] || "từ khó"}" cùng cô giáo AI 👩‍🏫`,
        `Tham gia thử thách nói từ vựng "${mispronouncedWords[0] || "từ khó"}" chậm rãi 3 lần liên tiếp 🐢`,
        `Nghe audio mẫu của câu này và nhại giọng theo thật vui nhộn 🎵`
      ],
    };
  }
}

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

    if (audioSize < 6000) {
      const targetWords = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase().split(/\s+/).filter(Boolean);
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

    const file = new File([audioBuffer], "audio.webm", { type: "audio/webm" });

    const transcription = await groq.audio.transcriptions.create({
      model: "whisper-large-v3",
      file: file,
      language: "en",
    });

    const spokenText = (transcription.text || "").trim();
    console.log(`📝 [Groq Whisper] Transcribed text: "${spokenText}"`);

    const cleanedSentence = sentence.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const targetWords = cleanedSentence.split(/\s+/).filter(Boolean);
    const cleanedSpoken = spokenText.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").toLowerCase();
    const spokenWords = cleanedSpoken.split(/\s+/).filter(Boolean);

    const tempSpoken = [...spokenWords];
    const mispronouncedWords: string[] = [];

    targetWords.forEach((word) => {
      const index = tempSpoken.indexOf(word);
      if (index !== -1) {
        tempSpoken.splice(index, 1);
      } else {
        mispronouncedWords.push(word);
      }
    });

    const totalCount = targetWords.length;
    const correctCount = totalCount - mispronouncedWords.length;
    const score = Math.round((correctCount / totalCount) * 100);

    let stars = 5;
    if (score >= 95) stars = 5;
    else if (score >= 85) stars = 5;
    else if (score >= 70) stars = 4;
    else if (score >= 45) stars = 3;
    else if (score >= 20) stars = 2;
    else stars = 1;

    console.log(`🧠 [AI Feedback] Đang gọi Mistral AI sinh nhận xét...`);
    const aiFeedback = await generateAIFeedback(sentence, spokenText, score, mispronouncedWords, level);
    console.log(`✅ [AI Feedback] Nhận xét:`, aiFeedback);

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
