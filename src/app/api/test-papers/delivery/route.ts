import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";
import TestPaper from "@/models/TestPaper";
import Question from "@/models/Question";
import CambridgeQuestion from "@/models/CambridgeQuestion";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const moduleType = searchParams.get("moduleType"); // "interactive" or "yle"
    
    if (!moduleType || (moduleType !== "interactive" && moduleType !== "yle")) {
      return NextResponse.json({ success: false, error: "Invalid moduleType" }, { status: 400 });
    }

    let config = await AppConfig.findOne({ singletonId: "global_config" }).lean();
    if (!config) {
      config = await AppConfig.create({
        singletonId: "global_config",
        interactiveMode: "random",
        interactiveFixedTestId: "",
        yleMode: "random",
        yleFixedTestId: "",
      });
    }

    const mode = moduleType === "interactive" ? config.interactiveMode : config.yleMode;
    const fixedId = moduleType === "interactive" ? config.interactiveFixedTestId : config.yleFixedTestId;

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

    let questions = [];

    if (targetPaper && targetPaper.questionIds && targetPaper.questionIds.length > 0) {
      if (moduleType === "interactive") {
        questions = await Question.find({ id: { $in: targetPaper.questionIds } }).lean();
      } else {
        questions = await CambridgeQuestion.find({ id: { $in: targetPaper.questionIds } })
          .sort({ section: 1, part: 1, taskNumber: 1, questionNumberInTask: 1 })
          .lean();
      }
    } else {
      // Fallback: If no test paper found, return ALL questions (legacy behavior)
      if (moduleType === "interactive") {
        questions = await Question.find({}).lean();
      } else {
        questions = await CambridgeQuestion.find({})
          .sort({ section: 1, part: 1, taskNumber: 1, questionNumberInTask: 1 })
          .lean();
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
