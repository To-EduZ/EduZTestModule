import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import { inMemoryAssessments } from "@/lib/dbStore";

// Seed a mock user ID for kid assessment testing
const DEFAULT_USER_ID = "kid_primary_std_01";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      level,
      skill,
      sentence,
      spokenText,
      score,
      stars,
      mispronouncedWords,
      feedback,
      roadmap,
      recordedAudioUrl,
      targetAnswer,
      userAnswer,
      corrections,
    } = body;

    // Validate request data
    if (!level || !sentence || score === undefined || stars === undefined || !feedback) {
      return NextResponse.json(
        { error: "Dữ liệu gửi lên thiếu thông tin cần thiết!" },
        { status: 400 }
      );
    }

    const { isFallback } = await connectToDatabase();
    
    const assessmentData = {
      userId: body.userId || DEFAULT_USER_ID,
      level,
      skill: skill || "Speaking",
      sentence,
      spokenText: spokenText || "",
      score,
      stars,
      mispronouncedWords: mispronouncedWords || [],
      feedback,
      roadmap: roadmap || [],
      recordedAudioUrl: recordedAudioUrl || "",
      targetAnswer: targetAnswer || "",
      userAnswer: userAnswer || "",
      corrections: corrections || "",
      createdAt: new Date(),
    };

    let savedData;

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
      // Fallback in-memory save
      savedData = {
        _id: `mem_${Math.random().toString(36).substr(2, 9)}`,
        ...assessmentData,
      };
      inMemoryAssessments.unshift(savedData);
      console.log(`💾 Đã lưu bài nói của bé vào BỘ NHỚ TẠM (FALLBACK), ID: ${savedData._id}`);
    }

    return NextResponse.json({
      success: true,
      data: savedData,
      isMockDb: isFallback || savedData._id.toString().startsWith("mem_"),
    });
  } catch (error: any) {
    console.error("❌ Lỗi API POST assessments:", error);
    return NextResponse.json(
      { error: "Không thể lưu kết quả đánh giá: " + error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    const { isFallback } = await connectToDatabase();

    // 1. LẤY CHI TIẾT THEO ID CỦA BÀI THI NÓI
    if (id) {
      let result = null;

      if (!isFallback) {
        try {
          result = await AssessmentResult.findById(id);
        } catch (dbError) {
          console.warn(`⚠️ Tìm kiếm trên MongoDB thất bại, tìm kiếm trong bộ nhớ tạm cho ID: ${id}`);
        }
      }

      // Nếu MongoDB không chạy hoặc không tìm thấy bản ghi, tìm trong bộ nhớ tạm
      if (!result) {
        result = inMemoryAssessments.find((item) => item._id.toString() === id);
      }

      if (!result) {
        // Tạo một mock data mẫu nếu không tìm thấy bất kỳ đâu (giúp UI không bị crash khi truy cập link ngẫu nhiên)
        if (id.startsWith("mock_")) {
          const levelFromMock = id.includes("Flyers") ? "Flyers" : id.includes("Movers") ? "Movers" : "Starters";
          result = {
            _id: id,
            userId: DEFAULT_USER_ID,
            level: levelFromMock,
            sentence: levelFromMock === "Starters" 
              ? "The fat cat sat on the red mat." 
              : levelFromMock === "Movers"
              ? "Yesterday, the clever monkey washed a big round melon."
              : "The brave flying lion flew high in the beautiful sky.",
            score: 80,
            stars: 4,
            spokenText: "",
            mispronouncedWords: levelFromMock === "Starters" ? ["cat"] : levelFromMock === "Movers" ? ["washed"] : ["flew"],
            feedback: {
              tutorComment: "Con làm tốt lắm! Phát âm rất rõ ràng và trôi chảy. Chỉ cần chú ý sửa một chút xíu lỗi nhỏ nữa là đạt 5 sao luôn nè! 🌟🐒",
              tips: "Hãy chú ý nhấn rõ hơi hoặc bật âm đuôi (ending sound) rõ hơn nữa nhé.",
            },
            roadmap: [
              "Nghe lại từ mẫu và lặp lại 3 lần thật to trước gương 🪞",
              "Chơi trò chơi 'Bật âm đuôi' thật gió 🌬️",
              "Thử thách đọc lại cả câu này lần thứ hai để chinh phục trọn vẹn 5 sao vàng 🏆"
            ],
            createdAt: new Date(),
          };
        } else {
          return NextResponse.json(
            { error: "Không tìm thấy kết quả đánh giá cho ID này!" },
            { status: 404 }
          );
        }
      }

      return NextResponse.json({ success: true, data: result });
    }

    // 2. LẤY TOÀN BỘ DANH SÁCH BÀI THI NÓI
    let resultsList = [];
    if (!isFallback) {
      try {
        resultsList = await AssessmentResult.find().sort({ createdAt: -1 });
      } catch (dbError) {
        console.warn("⚠️ Trích xuất danh sách từ MongoDB lỗi, dùng bộ nhớ tạm.");
        resultsList = [...inMemoryAssessments];
      }
    } else {
      resultsList = [...inMemoryAssessments];
    }

    return NextResponse.json({
      success: true,
      count: resultsList.length,
      data: resultsList,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET assessments:", error);
    return NextResponse.json(
      { error: "Không thể lấy thông tin đánh giá: " + error.message },
      { status: 500 }
    );
  }
}
