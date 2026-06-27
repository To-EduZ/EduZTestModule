import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import TestPaper from "@/models/TestPaper";
import Question from "@/models/Question";


export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const moduleType = searchParams.get("moduleType"); // "interactive"
    
    if (!moduleType || moduleType !== "interactive") {
      return NextResponse.json({ success: false, error: "Invalid moduleType" }, { status: 400 });
    }

    let config = await AppConfig.findOne({ singletonId: "global_config" }).lean();
    if (!config) {
      config = await AppConfig.create({
        singletonId: "global_config",
        interactiveMode: "random",
        interactiveFixedTestId: "",

      });
    }

    const mode = config.interactiveMode;
    const fixedId = config.interactiveFixedTestId;

    let targetPaper = null;

    if (mode === "fixed" && fixedId) {
      targetPaper = await TestPaper.findOne({ id: fixedId, moduleType }).lean();
    } else {
      // mode === "random" or fallback if fixedId not found
      const publishedPapers = await TestPaper.find({ moduleType, status: "published" }).lean();
      if (publishedPapers.length > 0) {
        const randomIndex = Math.floor(Math.random() * publishedPapers.length);
        targetPaper = publishedPapers[randomIndex];
      }
    }

    let questions: any[] = [];

    if (targetPaper && targetPaper.questionIds && targetPaper.questionIds.length > 0) {
      if (moduleType === "interactive") {
        questions = await Question.find({ id: { $in: targetPaper.questionIds } }).lean();
      }
    } else {
      // Fallback: If no test paper found, return ALL questions (legacy behavior)
      if (moduleType === "interactive") {
        questions = await Question.find({}).lean();
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: {
        testPaper: targetPaper,
        questions: questions
      }
    });
  } catch (error: any) {
    console.error("GET test-papers/delivery error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
