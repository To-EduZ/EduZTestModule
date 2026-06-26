import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, schoolName, className, age, parentPhone } = body;

    if (!name || !schoolName || !className || !age || !parentPhone) {
      return NextResponse.json(
        { error: "Vui lòng điền đầy đủ các trường thông tin." },
        { status: 400 }
      );
    }

    const { isFallback } = await connectToDatabase();

    if (isFallback) {
      // In fallback mode, just generate a temporary ID
      const tempId = `mem_user_${Math.random().toString(36).substr(2, 9)}`;
      console.log(`💾 Fallback Mode: Tạo User giả lập ID = ${tempId}`);
      return NextResponse.json({
        success: true,
        userId: tempId,
      });
    }

    // Check if user already exists based on name and phone (simple logic to update instead of duplicate)
    let user = await User.findOne({ 
      name: name,
      "parentContact.phone": parentPhone 
    });

    if (user) {
      // Update existing user
      user.schoolName = schoolName;
      user.className = className;
      user.age = Number(age);
      await user.save();
      console.log(`👤 Đã cập nhật User hiện tại: ${user._id}`);
    } else {
      // Create new user
      user = new User({
        name,
        age: Number(age),
        schoolName,
        className,
        parentContact: {
          phone: parentPhone
        },
        currentLevel: "Starters" // Default
      });
      await user.save();
      console.log(`👤 Đã tạo User mới: ${user._id}`);
    }

    return NextResponse.json({
      success: true,
      userId: user._id.toString(),
    });
  } catch (error: any) {
    console.error("❌ Lỗi API POST /api/users:", error);
    return NextResponse.json(
      { error: "Lỗi lưu thông tin người dùng: " + error.message },
      { status: 500 }
    );
  }
}
