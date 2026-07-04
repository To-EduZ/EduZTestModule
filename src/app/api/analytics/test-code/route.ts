import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import InteractiveSession from "@/models/InteractiveSession";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");

    if (!code || !code.trim()) {
      return NextResponse.json(
        { success: false, error: "Vui lòng cung cấp mã phòng thi!" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedCode = code.trim();

    // Use MongoDB Aggregation Pipeline to generate report statistics
    const stats = await InteractiveSession.aggregate([
      { $match: { testCode: normalizedCode } },
      {
        $group: {
          _id: "$testCode",
          totalSubmissions: { $sum: 1 },
          avgSpeaking: { $avg: "$scores.speaking" },
          avgListening: { $avg: "$scores.listening" },
          avgReading: { $avg: "$scores.reading" },
          avgWriting: { $avg: "$scores.writing" },
          avgStars: { 
            $avg: {
              $cond: [
                { $ne: ["$studentStars", null] },
                "$studentStars",
                "$$REMOVE"
              ]
            }
          },
          students: {
            $push: {
              _id: "$_id",
              kidName: "$kidName",
              kidAge: "$kidAge",
              scores: "$scores",
              overallLevel: "$overallLevel",
              studentStars: "$studentStars",
              createdAt: "$createdAt"
            }
          }
        }
      }
    ]);

    if (stats.length === 0) {
      return NextResponse.json({
        success: true,
        count: 0,
        data: {
          testCode: normalizedCode,
          totalSubmissions: 0,
          avgSpeaking: 0,
          avgListening: 0,
          avgReading: 0,
          avgWriting: 0,
          avgStars: 0,
          students: []
        }
      });
    }

    const report = stats[0];

    return NextResponse.json({
      success: true,
      count: report.totalSubmissions,
      data: {
        testCode: report._id,
        totalSubmissions: report.totalSubmissions,
        avgSpeaking: Math.round((report.avgSpeaking || 0) * 10) / 10,
        avgListening: Math.round((report.avgListening || 0) * 10) / 10,
        avgReading: Math.round((report.avgReading || 0) * 10) / 10,
        avgWriting: Math.round((report.avgWriting || 0) * 10) / 10,
        avgStars: report.avgStars ? Math.round(report.avgStars * 10) / 10 : null,
        students: report.students.sort(
          (a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
      }
    });
  } catch (error: any) {
    console.error("GET /api/analytics/test-code error:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi tạo thống kê phòng thi: " + error.message },
      { status: 500 }
    );
  }
}
