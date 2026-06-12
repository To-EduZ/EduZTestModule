import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AssessmentResult from "@/models/AssessmentResult";
import { inMemoryAssessments } from "@/lib/dbStore";
import { generateDevelopmentReport } from "@/lib/aiAssessor";

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectToDatabase();
    
    // 1. Fetch assessments history
    let resultsList = [];
    if (!isFallback) {
      try {
        resultsList = await AssessmentResult.find().sort({ createdAt: -1 });
      } catch (dbError) {
        console.warn("⚠️ Cannot read from MongoDB, fallback to memory store.");
        resultsList = [...inMemoryAssessments];
      }
    } else {
      resultsList = [...inMemoryAssessments];
    }

    // 2. If no history exists, inject mock items for initial dashboard preview
    if (resultsList.length === 0) {
      resultsList = [
        {
          skill: "Speaking",
          level: "Movers",
          score: 85,
          stars: 4,
          sentence: "Yesterday, the clever monkey washed a big round melon.",
          mispronouncedWords: ["clever", "monkey"],
          createdAt: new Date(Date.now() - 86400000 * 3)
        },
        {
          skill: "Listening",
          level: "Movers",
          score: 90,
          stars: 5,
          sentence: "Select the animal wearing a red hat.",
          mispronouncedWords: [],
          createdAt: new Date(Date.now() - 86400000 * 2)
        },
        {
          skill: "Reading",
          level: "Movers",
          score: 75,
          stars: 3,
          sentence: "The little rabbit jumped over the brown fence.",
          mispronouncedWords: ["rabbit", "fence"],
          createdAt: new Date(Date.now() - 86400000 * 1.5)
        },
        {
          skill: "Writing",
          level: "Movers",
          score: 65,
          stars: 3,
          sentence: "Banana spelling challenge",
          mispronouncedWords: [],
          createdAt: new Date(Date.now() - 86400000 * 1)
        }
      ];
    }

    // 3. Generate development report via AI or formulaic fallback
    const report = await generateDevelopmentReport(resultsList);

    return NextResponse.json({
      success: true,
      report,
      dataUsed: {
        totalTests: resultsList.length,
        levelsReached: Array.from(new Set(resultsList.map(a => a.level))),
      }
    });
  } catch (error: any) {
    console.error("❌ Error in AI development report endpoint:", error);
    return NextResponse.json(
      { error: "Internal Server Error: " + error.message },
      { status: 500 }
    );
  }
}
