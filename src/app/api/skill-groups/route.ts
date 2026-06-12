import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import SkillGroup from "@/models/SkillGroup";
import { inMemorySkillGroups } from "@/lib/dbStore";

const DEFAULT_GROUPS = [
  { code: "1.1", name: "Vocabulary & Pronunciation", description: "Từ vựng & Phát âm" },
  { code: "1.2", name: "Grammar & Sentence Structure", description: "Ngữ pháp & Cấu trúc" },
  { code: "2.1", name: "Speaking Reflexes", description: "Phản xạ nói" },
  { code: "2.2", name: "Storytelling & Description", description: "Kể chuyện & Miêu tả" }
];

export async function GET() {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json({ success: true, data: inMemorySkillGroups });
    }

    let groups = await SkillGroup.find({}).sort({ code: 1 });
    if (groups.length === 0) {
      // Auto seed default skill groups
      await SkillGroup.insertMany(DEFAULT_GROUPS);
      groups = await SkillGroup.find({}).sort({ code: 1 });
    }

    return NextResponse.json({ success: true, data: groups });
  } catch (error: any) {
    console.error("❌ Error GET skill-groups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, name, description } = body;
    if (!code || !name) {
      return NextResponse.json({ error: "Code and Name are required" }, { status: 400 });
    }

    const cleanCode = code.trim();
    const cleanName = name.trim();
    const cleanDesc = (description || "").trim();

    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      const exists = inMemorySkillGroups.some((g: any) => g.code === cleanCode);
      if (exists) {
        return NextResponse.json({ error: "Mã nhóm kỹ năng đã tồn tại!" }, { status: 400 });
      }
      const newGroup = { code: cleanCode, name: cleanName, description: cleanDesc };
      inMemorySkillGroups.push(newGroup);
      return NextResponse.json({ success: true, data: newGroup });
    }

    // Check duplicate code
    const exists = await SkillGroup.findOne({ code: cleanCode });
    if (exists) {
      return NextResponse.json({ error: "Mã nhóm kỹ năng đã tồn tại!" }, { status: 400 });
    }

    const newGroup = new SkillGroup({ code: cleanCode, name: cleanName, description: cleanDesc });
    await newGroup.save();

    return NextResponse.json({ success: true, data: newGroup });
  } catch (error: any) {
    console.error("❌ Error POST skill-groups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id"); // ID or code

    if (!id) {
      return NextResponse.json({ error: "ID or code is required" }, { status: 400 });
    }

    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      const index = inMemorySkillGroups.findIndex((g: any) => g.code === id);
      if (index === -1) {
        return NextResponse.json({ error: "Không tìm thấy nhóm kỹ năng cần xóa!" }, { status: 404 });
      }
      inMemorySkillGroups.splice(index, 1);
      return NextResponse.json({ success: true, message: "Đã xóa nhóm kỹ năng thành công!" });
    }

    // Database delete - check if it's MongoDB object id or key code
    let groupDoc = await SkillGroup.findById(id);
    if (!groupDoc) {
      groupDoc = await SkillGroup.findOne({ code: id });
    }

    if (!groupDoc) {
      return NextResponse.json({ error: "Không tìm thấy nhóm kỹ năng cần xóa!" }, { status: 404 });
    }

    await SkillGroup.deleteOne({ _id: groupDoc._id });
    return NextResponse.json({ success: true, message: "Đã xóa nhóm kỹ năng thành công!" });
  } catch (error: any) {
    console.error("❌ Error DELETE skill-groups:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
