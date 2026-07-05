import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TestPaper from "@/models/TestPaper";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    
    if (!code || !code.trim()) {
      return NextResponse.json({ success: false, error: "Vui lòng cung cấp mã phòng thi!" }, { status: 400 });
    }
    
    // Find test paper with the matching test code
    const paper = await TestPaper.findOne({ testCode: code.trim() }).lean();
    
    if (!paper) {
      return NextResponse.json({ 
        success: false, 
        error: "Mã phòng thi không tồn tại!" 
      }, { status: 404 });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: {
        id: paper.id,
        name: paper.name,
        moduleType: paper.moduleType,
        sections: paper.sections || [],
      } 
    });
  } catch (error: any) {
    console.error("GET test-papers/verify error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
