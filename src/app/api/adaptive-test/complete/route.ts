import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AdaptiveSession from "@/models/AdaptiveSession";
import User from "@/models/User";
import { generateParentRecommendation } from "@/lib/aiAssessor";
import { thetaToLevel } from "@/lib/irtEngine";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    await connectToDatabase();
    const session = await AdaptiveSession.findOne({ sessionId });
    
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Calculate final scores
    let vocabScore = 0, grammarScore = 0, pronScore = 0, fluencyScore = 0;
    let vocabCount = 0, grammarCount = 0, pronCount = 0, fluencyCount = 0;

    session.questionSequence.forEach((q: any) => {
      if (q.skill === "Reading") { vocabScore += q.score; vocabCount++; }
      if (q.skill === "Writing") { grammarScore += q.score; grammarCount++; }
      if (q.skill === "Speaking") { pronScore += q.score; pronCount++; }
      if (q.skill === "Listening") { fluencyScore += q.score; fluencyCount++; }
    });

    const finalScores = {
      vocabulary: vocabCount > 0 ? Math.round(vocabScore / vocabCount) : 0,
      grammar: grammarCount > 0 ? Math.round(grammarScore / grammarCount) : 0,
      pronunciation: pronCount > 0 ? Math.round(pronScore / pronCount) : 0,
      fluency: fluencyCount > 0 ? Math.round(fluencyScore / fluencyCount) : 0,
      overall: 0
    };
    
    const divisor = (vocabCount > 0 ? 1 : 0) + (grammarCount > 0 ? 1 : 0) + (pronCount > 0 ? 1 : 0) + (fluencyCount > 0 ? 1 : 0);
    finalScores.overall = divisor > 0 ? Math.round((finalScores.vocabulary + finalScores.grammar + finalScores.pronunciation + finalScores.fluency) / divisor) : 0;

    session.finalScores = finalScores;
    session.finalLevel = thetaToLevel(session.currentTheta);
    
    // Generate AI recommendation
    const recommendation = await generateParentRecommendation(session);
    session.aiRecommendation = recommendation;

    await session.save();

    // Update user profile
    await User.findOneAndUpdate(
      { _id: session.userId }, // Actually we should use userId from session
      { 
        estimatedLevel: session.finalLevel,
        $push: { catHistory: sessionId }
      }
    ).catch(e => console.warn("Could not update user:", e));

    return NextResponse.json({
      success: true,
      finalScores,
      finalLevel: session.finalLevel,
      aiRecommendation: recommendation
    });
  } catch (error: any) {
    console.error("Error completing session:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
