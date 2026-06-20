import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import AppConfig from "@/models/AppConfig";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Upsert singleton config
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
      
    return NextResponse.json({ success: true, data: config });
  } catch (error: any) {
    console.error("GET app-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const data = await req.json();

    const updated = await AppConfig.findOneAndUpdate(
      { singletonId: "global_config" },
      { $set: data },
      { new: true, runValidators: true, upsert: true }
    );

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT app-config error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
