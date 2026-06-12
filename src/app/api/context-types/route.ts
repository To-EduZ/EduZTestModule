import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import ContextType from "@/models/ContextType";
import { inMemoryContextTypes } from "@/lib/dbStore";

const DEFAULT_TYPES = [
  { key: "Scene_Description", name: "Scene Description (Mô tả tranh bối cảnh)" },
  { key: "Object_Card", name: "Object Card (Thẻ vật thể bóc tách)" },
  { key: "Storytelling", name: "Storytelling (Kể chuyện theo tranh liên hoàn)" },
  { key: "Find_Differences", name: "Find the Differences (Tìm điểm khác biệt)" }
];

export async function GET() {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json({ success: true, data: inMemoryContextTypes });
    }

    let types = await ContextType.find({}).sort({ createdAt: 1 });
    if (types.length === 0) {
      // Auto seed defaults
      await ContextType.insertMany(DEFAULT_TYPES);
      types = await ContextType.find({}).sort({ createdAt: 1 });
    }

    return NextResponse.json({ success: true, data: types });
  } catch (error: any) {
    console.error("❌ Error GET context-types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, name } = body;
    if (!key || !name) {
      return NextResponse.json({ error: "Key and Name are required" }, { status: 400 });
    }

    const cleanKey = key.trim();
    const cleanName = name.trim();

    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      const exists = inMemoryContextTypes.some((t: any) => t.key === cleanKey);
      if (exists) {
        return NextResponse.json({ error: "Mã bối cảnh đã tồn tại!" }, { status: 400 });
      }
      const newType = { key: cleanKey, name: cleanName };
      inMemoryContextTypes.push(newType);
      return NextResponse.json({ success: true, data: newType });
    }

    // Check duplicate
    const exists = await ContextType.findOne({ key: cleanKey });
    if (exists) {
      return NextResponse.json({ error: "Mã bối cảnh đã tồn tại!" }, { status: 400 });
    }

    const newType = new ContextType({ key: cleanKey, name: cleanName });
    await newType.save();

    return NextResponse.json({ success: true, data: newType });
  } catch (error: any) {
    console.error("❌ Error POST context-types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, key, name } = body;
    if (!id || !key || !name) {
      return NextResponse.json({ error: "ID, Key and Name are required" }, { status: 400 });
    }

    const cleanKey = key.trim();
    const cleanName = name.trim();

    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      const index = inMemoryContextTypes.findIndex((t: any) => t.key === id);
      if (index === -1) {
        return NextResponse.json({ error: "Không tìm thấy loại bối cảnh cần sửa!" }, { status: 404 });
      }
      if (cleanKey !== id && inMemoryContextTypes.some((t: any) => t.key === cleanKey)) {
        return NextResponse.json({ error: "Mã bối cảnh mới đã tồn tại!" }, { status: 400 });
      }
      inMemoryContextTypes[index].key = cleanKey;
      inMemoryContextTypes[index].name = cleanName;
      return NextResponse.json({ success: true, data: inMemoryContextTypes[index] });
    }

    // Database update
    const typeDoc = await ContextType.findById(id);
    if (!typeDoc) {
      return NextResponse.json({ error: "Không tìm thấy loại bối cảnh cần sửa!" }, { status: 404 });
    }

    // Check duplicate key if changed
    if (cleanKey !== typeDoc.key) {
      const duplicate = await ContextType.findOne({ key: cleanKey });
      if (duplicate) {
        return NextResponse.json({ error: "Mã bối cảnh mới đã tồn tại!" }, { status: 400 });
      }
    }

    typeDoc.key = cleanKey;
    typeDoc.name = cleanName;
    await typeDoc.save();

    return NextResponse.json({ success: true, data: typeDoc });
  } catch (error: any) {
    console.error("❌ Error PUT context-types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      const index = inMemoryContextTypes.findIndex((t: any) => t.key === id);
      if (index === -1) {
        return NextResponse.json({ error: "Không tìm thấy loại bối cảnh cần xóa!" }, { status: 404 });
      }
      inMemoryContextTypes.splice(index, 1);
      return NextResponse.json({ success: true, message: "Đã xóa loại bối cảnh thành công!" });
    }

    // Database delete
    let typeDoc = await ContextType.findById(id);
    if (!typeDoc) {
      typeDoc = await ContextType.findOne({ key: id });
    }

    if (!typeDoc) {
      return NextResponse.json({ error: "Không tìm thấy loại bối cảnh cần xóa!" }, { status: 404 });
    }

    await ContextType.deleteOne({ _id: typeDoc._id });
    return NextResponse.json({ success: true, message: "Đã xóa loại bối cảnh thành công!" });
  } catch (error: any) {
    console.error("❌ Error DELETE context-types:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
