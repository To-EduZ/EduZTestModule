import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import TestPaper from "@/models/TestPaper";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const moduleType = searchParams.get("moduleType");
    
    const query: any = {};
    if (moduleType) query.moduleType = moduleType;
    
    const papers = await TestPaper.find(query).sort({ createdAt: -1 }).lean();
      
    return NextResponse.json({ success: true, data: papers });
  } catch (error: any) {
    console.error("GET test-papers error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();
    
    if (!data.id || !data.name || !data.moduleType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }
    
    const newPaper = await TestPaper.create(data);
    return NextResponse.json({ success: true, data: newPaper });
  } catch (error: any) {
    console.error("POST test-papers error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "TestPaper ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    if (!data.id) {
      return NextResponse.json({ success: false, error: "TestPaper ID is required for update" }, { status: 400 });
    }

    const updated = await TestPaper.findOneAndUpdate(
      { id: data.id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "TestPaper not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT test-papers error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing TestPaper id" }, { status: 400 });
    }

    const deleted = await TestPaper.findOneAndDelete({ id });
    if (!deleted) {
      return NextResponse.json({ success: false, error: "TestPaper not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("DELETE test-papers error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
