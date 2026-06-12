import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AdaptiveSession from "@/models/AdaptiveSession";
import { adaptiveQuestionBank } from "@/lib/adaptiveQuestionBank";
import { estimateThetaEAP, selectNextQuestion, thetaToLevel, shouldStopTest } from "@/lib/irtEngine";
import { transcribeAudio, gradeWriting } from "@/lib/aiAssessor";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;
    const questionId = formData.get("questionId") as string;
    const timeTakenMs = Number(formData.get("timeTakenMs")) || 5000;
    
    if (!sessionId || !questionId) {
      return NextResponse.json({ error: "Missing sessionId or questionId" }, { status: 400 });
    }

    await connectToDatabase();
    const session = await AdaptiveSession.findOne({ sessionId });
    
    if (!session || session.status !== "in_progress") {
      return NextResponse.json({ error: "Invalid or completed session" }, { status: 400 });
    }

    const question = adaptiveQuestionBank.find(q => q.id === questionId);
    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    let score = 0;
    let isCorrect = false;
    let userAnswer = "";

    // Grade response based on skill
    if (question.skill === "Speaking") {
      const audioFile = formData.get("audio") as File;
      if (!audioFile) return NextResponse.json({ error: "Missing audio" }, { status: 400 });
      
      const audioBuffer = Buffer.from(await audioFile.arrayBuffer());
      const transcribed = await transcribeAudio(audioBuffer);
      userAnswer = transcribed;

      const cleanTarget = question.prompt.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      const cleanSpoken = transcribed.toLowerCase().replace(/[^a-z0-9 ]/g, "");
      
      const targetWords = cleanTarget.split(" ");
      const spokenWords = cleanSpoken.split(" ");
      let matchCount = 0;
      targetWords.forEach(w => { if (spokenWords.includes(w)) matchCount++; });
      
      score = targetWords.length > 0 ? Math.round((matchCount / targetWords.length) * 100) : 0;
      isCorrect = score >= 70;
    } 
    else if (question.skill === "Writing") {
      userAnswer = formData.get("textAnswer") as string || "";
      const result = await gradeWriting(question.prompt, userAnswer, question.level);
      score = result.score;
      isCorrect = result.isCorrect;
    }
    else {
      // Reading & Listening
      userAnswer = formData.get("choice") as string || "";
      isCorrect = userAnswer === question.correctOption;
      score = isCorrect ? 100 : 0;
    }

    // Add to sequence
    session.questionSequence.push({
      questionId: question.id,
      skill: question.skill,
      level: question.level,
      response: userAnswer,
      isCorrect,
      score,
      timeTakenMs,
      irtDifficulty: question.difficulty
    });

    // Recalculate Theta
    const irtResponses = session.questionSequence.map(seq => {
      const q = adaptiveQuestionBank.find(bq => bq.id === seq.questionId)!;
      return {
        difficulty: q.difficulty,
        discrimination: q.discrimination,
        guessing: q.guessing,
        isCorrect: seq.isCorrect
      };
    });

    const { theta, standardError } = estimateThetaEAP(irtResponses);
    session.currentTheta = theta;
    session.currentLevel = thetaToLevel(theta);
    
    // Check stopping criteria
    const numQ = session.questionSequence.length;
    const isDone = shouldStopTest(numQ, standardError);

    let nextQuestion = null;
    if (!isDone) {
      const answeredIds = session.questionSequence.map(s => s.questionId);
      const skillCounts: Record<string, number> = {};
      session.questionSequence.forEach(s => {
        skillCounts[s.skill] = (skillCounts[s.skill] || 0) + 1;
      });
      nextQuestion = selectNextQuestion(theta, answeredIds, skillCounts);
    } else {
      session.status = "completed";
      session.completedAt = new Date();
    }

    await session.save();

    return NextResponse.json({
      success: true,
      isCorrect,
      score,
      newTheta: theta,
      newLevel: session.currentLevel,
      isDone: isDone || !nextQuestion,
      nextQuestion,
    });
  } catch (error: any) {
    console.error("Error processing answer:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
