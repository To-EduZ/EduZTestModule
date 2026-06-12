import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AdaptiveSession from "@/models/AdaptiveSession";
import { selectNextQuestion } from "@/lib/irtEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    await connectToDatabase();

    const sessionId = crypto.randomUUID();

    // Start with theta = 0 (Movers level)
    const initialTheta = 0;
    
    // Select first question
    const firstQuestion = selectNextQuestion(initialTheta, [], {});

    if (!firstQuestion) {
      return NextResponse.json({ error: "No questions available in question bank" }, { status: 500 });
    }

    const sessionData = {
      userId,
      sessionId,
      status: "in_progress",
      currentTheta: initialTheta,
      currentLevel: "Movers",
      questionSequence: [],
      conversationLog: [
        {
          role: "system",
          content: "Adaptive test session started.",
        },
        {
          role: "ai_tutor",
          content: "Xin chào! Cô giáo AI đã sẵn sàng cùng con khám phá thế giới Tiếng Anh qua bài kiểm tra thú vị này rồi nhé! 🚀",
        }
      ],
    };

    const newSession = new AdaptiveSession(sessionData);
    await newSession.save();

    return NextResponse.json({
      success: true,
      sessionId,
      firstQuestion,
    });
  } catch (error: any) {
    console.error("Error starting adaptive test:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
