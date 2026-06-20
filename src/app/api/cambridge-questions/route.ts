import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import CambridgeQuestion from "@/models/CambridgeQuestion";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    
    if (id) {
      const question = await CambridgeQuestion.findOne({ id }).lean();
      if (!question) {
        return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, data: question });
    }
    
    // Sort by section, part, taskNumber, questionNumberInTask
    const questions = await CambridgeQuestion.find({})
      .sort({ section: 1, part: 1, taskNumber: 1, questionNumberInTask: 1 })
      .lean();
      
    return NextResponse.json({ success: true, data: questions });
  } catch (error: any) {
    console.error("GET cambridge-questions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Check if it's multipart/form-data (contains images)
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const questionDataStr = formData.get("questionData") as string;
      if (!questionDataStr) {
         return NextResponse.json({ success: false, error: "Missing questionData" }, { status: 400 });
      }
      
      const data = JSON.parse(questionDataStr);
      
      // Upload images if any
      const images: string[] = [];
      for (let i = 0; i < 3; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "hubxanh_yle_images" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
          images.push(cloudinaryResponse.secure_url);
        }
      }
      
      if (images.length > 0) {
        data.images = images;
      }
      
      const newQuestion = await CambridgeQuestion.create(data);
      return NextResponse.json({ success: true, data: newQuestion });
    } else {
      // JSON payload
      const data = await req.json();
      const newQuestion = await CambridgeQuestion.create(data);
      return NextResponse.json({ success: true, data: newQuestion });
    }
  } catch (error: any) {
    console.error("POST cambridge-questions error:", error);
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: "Question ID already exists" }, { status: 400 });
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const contentType = req.headers.get("content-type") || "";
    let data;
    
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const questionDataStr = formData.get("questionData") as string;
      if (!questionDataStr) {
         return NextResponse.json({ success: false, error: "Missing questionData" }, { status: 400 });
      }
      
      data = JSON.parse(questionDataStr);
      
      // Upload images if any
      const images: string[] = data.images || []; // Keep existing if not overridden
      for (let i = 0; i < 3; i++) {
        const imageFile = formData.get(`image_${i}`) as File;
        if (imageFile) {
          const buffer = Buffer.from(await imageFile.arrayBuffer());
          const cloudinaryResponse = await new Promise<any>((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: "hubxanh_yle_images" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            ).end(buffer);
          });
          // Replace or add
          images[i] = cloudinaryResponse.secure_url;
        }
      }
      
      if (images.length > 0) {
        data.images = images;
      }
    } else {
      data = await req.json();
    }

    if (!data.id) {
      return NextResponse.json({ success: false, error: "Question ID is required for update" }, { status: 400 });
    }

    const updated = await CambridgeQuestion.findOneAndUpdate(
      { id: data.id },
      { $set: data },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (error: any) {
    console.error("PUT cambridge-questions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await connectToDatabase();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "Missing question id" }, { status: 400 });
    }

    const deleted = await CambridgeQuestion.findOneAndDelete({ id });
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Question not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: deleted });
  } catch (error: any) {
    console.error("DELETE cambridge-questions error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
