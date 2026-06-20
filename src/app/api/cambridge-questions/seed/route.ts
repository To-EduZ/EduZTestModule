import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CambridgeQuestion from "@/models/CambridgeQuestion";
import { CAMBRIDGE_QUESTIONS } from "@/lib/cambridgeQuestionBank";

export async function GET() {
  try {
    await connectToDatabase();
    
    let count = 0;
    
    // Clear existing to avoid duplicates if re-running
    await CambridgeQuestion.deleteMany({});
    
    for (const q of CAMBRIDGE_QUESTIONS) {
      await CambridgeQuestion.create(q);
      count++;
    }
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully seeded ${count} Cambridge YLE questions to MongoDB.` 
    });
  } catch (error: any) {
    console.error("Seed error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
