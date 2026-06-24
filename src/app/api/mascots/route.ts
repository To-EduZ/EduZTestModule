import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Mascot from "@/models/Mascot";
import { MASCOTS as fallbackMascots } from "@/config/mascots";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function uploadToCloudinary(file: File, folder: string): Promise<string> {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return new Promise<string>((resolve, reject) => {
    cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      }
    ).end(buffer);
  });
}

export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json({ success: true, data: fallbackMascots });
    }
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (id) {
      const mascot = await Mascot.findOne({ id }).lean();
      if (!mascot) {
        return NextResponse.json({ success: false, error: "Mascot not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: mascot });
    }
    
    const mascots = await Mascot.find({}).sort({ createdAt: 1 }).lean();
    if (mascots.length === 0) {
      console.log("No mascots found in DB, returning fallback configs.");
      return NextResponse.json({ success: true, data: fallbackMascots });
    }
    return NextResponse.json({ success: true, data: mascots });
  } catch (error: any) {
    console.error("GET mascots error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const contentType = req.headers.get("content-type") || "";
    let data: any = {};
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const mascotDataStr = formData.get("mascotData") as string;
      if (!mascotDataStr) {
        return NextResponse.json({ success: false, error: "Missing mascotData" }, { status: 400 });
      }
      data = JSON.parse(mascotDataStr);
      
      // Upload files
      const states = ["idle", "speaking", "listening", "thinking", "happy", "encouraging"];
      
      const file_avatar = formData.get("file_avatar") as File | null;
      if (file_avatar) {
        data.avatarUrl = await uploadToCloudinary(file_avatar, "mascots");
      }
      
      if (!data.images) data.images = {};
      for (const state of states) {
        const stateFile = formData.get(`file_${state}`) as File | null;
        if (stateFile) {
          data.images[state] = await uploadToCloudinary(stateFile, `mascots/${data.id || "temp"}`);
        }
      }
    } else {
      data = await req.json();
    }
    
    if (!data.id) {
      return NextResponse.json({ success: false, error: "Mascot ID is required" }, { status: 400 });
    }
    if (!data.name) {
      return NextResponse.json({ success: false, error: "Mascot Name is required" }, { status: 400 });
    }
    if (!data.avatarUrl) {
      return NextResponse.json({ success: false, error: "Avatar image is required" }, { status: 400 });
    }
    
    // Check if duplicate ID exists
    const duplicate = await Mascot.findOne({ id: data.id });
    if (duplicate) {
      return NextResponse.json({ success: false, error: "Mascot ID already exists" }, { status: 400 });
    }
    
    const newMascot = await Mascot.create(data);
    return NextResponse.json({ success: true, data: newMascot });
  } catch (error: any) {
    console.error("POST mascots error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const contentType = req.headers.get("content-type") || "";
    let data: any = {};
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const mascotDataStr = formData.get("mascotData") as string;
      if (!mascotDataStr) {
        return NextResponse.json({ success: false, error: "Missing mascotData" }, { status: 400 });
      }
      data = JSON.parse(mascotDataStr);
      
      // Upload files
      const states = ["idle", "speaking", "listening", "thinking", "happy", "encouraging"];
      
      const file_avatar = formData.get("file_avatar") as File | null;
      if (file_avatar) {
        data.avatarUrl = await uploadToCloudinary(file_avatar, "mascots");
      }
      
      if (!data.images) data.images = {};
      for (const state of states) {
        const stateFile = formData.get(`file_${state}`) as File | null;
        if (stateFile) {
          data.images[state] = await uploadToCloudinary(stateFile, `mascots/${data.id}`);
        }
      }
    } else {
      data = await req.json();
    }
    
    if (!data.id) {
      return NextResponse.json({ success: false, error: "Mascot ID is required" }, { status: 400 });
    }
    
    const updated = await Mascot.findOneAndUpdate(
      { id: data.id },
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!updated) {
      return NextResponse.json({ success: false, error: "Mascot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT mascots error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing mascot ID" }, { status: 400 });
    }
    
    const deleted = await Mascot.findOneAndDelete({ id });
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Mascot not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("DELETE mascots error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
