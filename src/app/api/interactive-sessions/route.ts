import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import InteractiveSession from "@/models/InteractiveSession";
import { inMemoryInteractiveSessions } from "@/lib/dbStore";

const DEFAULT_USER_ID = "kid_primary_std_01";

// 1. CREATE A NEW INTERACTIVE TEST SESSION RECORD
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      kidName,
      kidAge,
      scores,
      chatHistory,
      overallLevel,
      userId,
    } = body;

    // Validate required fields
    if (!kidName || kidAge === undefined || !scores || !overallLevel) {
      return NextResponse.json(
        { error: "Thiếu dữ liệu bắt buộc (Tên, Tuổi, Điểm số, Trình độ)!" },
        { status: 400 }
      );
    }

    const { isFallback } = await connectToDatabase();

    const sessionData = {
      userId: userId || DEFAULT_USER_ID,
      kidName,
      kidAge: Number(kidAge),
      scores: {
        speaking: Number(scores.speaking || 0),
        listening: Number(scores.listening || 0),
        reading: Number(scores.reading || 0),
        writing: Number(scores.writing || 0),
      },
      chatHistory: Array.isArray(chatHistory) ? chatHistory : [],
      studentStars: null, // Default: no rating at start
      overallLevel,
    };

    let savedSession;

    if (!isFallback) {
      try {
        const newSession = new InteractiveSession(sessionData);
        savedSession = await newSession.save();
        console.log(`💾 Đã lưu phiên tương tác AI vào MongoDB, ID: ${savedSession._id}`);
      } catch (dbError: any) {
        console.warn("⚠️ Ghi MongoDB thất bại. Lưu phiên tương tác vào bộ nhớ tạm.", dbError.message);
        savedSession = {
          _id: `mem_session_${Math.random().toString(36).substr(2, 9)}`,
          ...sessionData,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        inMemoryInteractiveSessions.unshift(savedSession);
      }
    } else {
      savedSession = {
        _id: `mem_session_${Math.random().toString(36).substr(2, 9)}`,
        ...sessionData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      inMemoryInteractiveSessions.unshift(savedSession);
      console.log(`💾 Đã lưu phiên tương tác AI vào BỘ NHỚ TẠM (FALLBACK), ID: ${savedSession._id}`);
    }

    return NextResponse.json({
      success: true,
      id: savedSession._id,
      data: savedSession,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/interactive-sessions:", error);
    return NextResponse.json(
      { error: "Không thể lưu phiên làm bài: " + error.message },
      { status: 500 }
    );
  }
}

// 2. UPDATE THE STAR RATING OF AN INTERACTIVE SESSION
export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ error: "Thiếu ID của phiên làm bài!" }, { status: 400 });
    }

    const body = await req.json();
    const { studentStars } = body;

    if (studentStars === undefined || studentStars < 1 || studentStars > 5) {
      return NextResponse.json({ error: "Số sao đánh giá phải từ 1 đến 5!" }, { status: 400 });
    }

    const { isFallback } = await connectToDatabase();
    let updated = false;

    if (!isFallback) {
      try {
        const result = await InteractiveSession.findByIdAndUpdate(
          id,
          { studentStars },
          { new: true }
        );
        if (result) {
          updated = true;
          console.log(`⭐ Đã cập nhật đánh giá ${studentStars} sao cho phiên ${id} trên MongoDB`);
        }
      } catch (dbError: any) {
        console.warn(`⚠️ Cập nhật trên MongoDB thất bại cho phiên ${id}, thử cập nhật bộ nhớ tạm.`);
      }
    }

    if (!updated) {
      // Look up and update in memory array
      const memIndex = inMemoryInteractiveSessions.findIndex(
        (item: any) => item._id.toString() === id
      );
      if (memIndex !== -1) {
        inMemoryInteractiveSessions[memIndex].studentStars = studentStars;
        inMemoryInteractiveSessions[memIndex].updatedAt = new Date();
        updated = true;
        console.log(`⭐ Đã cập nhật đánh giá ${studentStars} sao cho phiên ${id} trong BỘ NHỚ TẠM`);
      }
    }

    if (!updated) {
      return NextResponse.json({ error: "Không tìm thấy phiên làm bài để cập nhật!" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("❌ Lỗi API PUT /api/interactive-sessions:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật đánh giá: " + error.message },
      { status: 500 }
    );
  }
}

// 3. GET SESSIONS LIST AND SUMMARY ANALYTICS
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    
    const { isFallback } = await connectToDatabase();
    let rawList: any[] = [];

    if (!isFallback) {
      try {
        let query = {};
        if (search) {
          query = { kidName: { $regex: search, $options: "i" } };
        }
        rawList = await InteractiveSession.find(query).sort({ createdAt: -1 }).lean();
      } catch (dbError) {
        console.warn("⚠️ Trích xuất danh sách từ MongoDB lỗi, dùng bộ nhớ tạm.");
        rawList = [...inMemoryInteractiveSessions];
      }
    } else {
      rawList = [...inMemoryInteractiveSessions];
    }

    // Apply client-side search filter for memory fallback if search parameter is active
    if (isFallback && search) {
      const lowerSearch = search.toLowerCase();
      rawList = rawList.filter(item => (item.kidName || "").toLowerCase().includes(lowerSearch));
    }

    // Sort list by createdAt desc (newest first)
    rawList.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Calculate Summary Stats
    const totalTests = rawList.length;
    let totalScoreSum = 0;
    let ratedCount = 0;
    let starsSum = 0;
    const starDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    rawList.forEach((session) => {
      // Calculate overall average of the 4 skills
      const avgScore = (
        (session.scores?.speaking || 0) +
        (session.scores?.listening || 0) +
        (session.scores?.reading || 0) +
        (session.scores?.writing || 0)
      ) / 4;
      totalScoreSum += avgScore;

      // Extract stars satisfaction feedback
      if (session.studentStars !== null && session.studentStars !== undefined) {
        const starVal = Number(session.studentStars);
        if (starVal >= 1 && starVal <= 5) {
          ratedCount++;
          starsSum += starVal;
          starDistribution[starVal] = (starDistribution[starVal] || 0) + 1;
        }
      }
    });

    const avgOverallScore = totalTests > 0 ? Math.round(totalScoreSum / totalTests) : 0;
    const avgStars = ratedCount > 0 ? Number((starsSum / ratedCount).toFixed(1)) : 0;

    const stats = {
      totalTests,
      avgOverallScore,
      avgStars,
      starDistribution,
      ratedCount,
    };

    return NextResponse.json({
      success: true,
      count: rawList.length,
      data: rawList,
      stats,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET /api/interactive-sessions:", error);
    return NextResponse.json(
      { error: "Lỗi trích xuất phiên làm bài: " + error.message },
      { status: 500 }
    );
  }
}
