import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/mongodb";
import Question from "@/models/Question";
import { v2 as cloudinary } from "cloudinary";

// Configure Cloudinary SDK
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * GET: Reads all questions from the database, supporting optional filters (level, part)
 */
export async function GET(req: NextRequest) {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json(
        { error: "Không thể kết nối đến cơ sở dữ liệu MongoDB Atlas!" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const partStr = searchParams.get("part");
    const topic = searchParams.get("topic");

    const filter: any = {};
    if (level) {
      if (["Starters", "Movers", "Flyers"].includes(level)) {
        filter.level = level;
      }
    }

    if (partStr) {
      const part = parseInt(partStr, 10);
      if (!isNaN(part)) {
        filter.part = part;
      }
    }

    if (topic) {
      filter.topic = { $regex: new RegExp(topic, "i") }; // Case-insensitive matching
    }

    const questions = await Question.find(filter).sort({ createdAt: -1 });

    return NextResponse.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API GET questions:", error);
    return NextResponse.json(
      { error: "Không thể lấy danh sách câu hỏi: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * POST: Uploads an image to Cloudinary and saves question metadata to MongoDB
 */
export async function POST(req: NextRequest) {
  try {
    // 1. Verify Cloudinary credentials are configured
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        {
          error: "Thiếu cấu hình Cloudinary! Bé/Admin vui lòng cấu hình CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, và CLOUDINARY_API_SECRET vào file .env.local nhé! ☁️",
        },
        { status: 500 }
      );
    }

    // 2. Connect to MongoDB Atlas
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json(
        { error: "Không thể kết nối cơ sở dữ liệu MongoDB Atlas phục vụ việc lưu trữ!" },
        { status: 500 }
      );
    }

    // 3. Extract request parameters
    const formData = await req.formData();
    const id = formData.get("id") as string;
    const level = formData.get("level") as "Starters" | "Movers" | "Flyers";
    const partStr = formData.get("part") as string;
    const type = formData.get("type") as string;
    const topic = (formData.get("topic") as string) || "General";
    const difficulty = ((formData.get("difficulty") as string) || "Medium") as "Easy" | "Medium" | "Hard";
    const examinerScript = formData.get("examinerScript") as string;
    const contextTagsRaw = formData.get("contextTags") as string;
    const expectedKeywordsRaw = formData.get("expectedKeywords") as string;
    const targetGrammarRaw = formData.get("targetGrammar") as string;
    const questionsRaw = formData.get("questions") as string;
    const imageFile = formData.get("image") as File | null;

    // 4. Validate parameters (partStr is optional, inferred from ID or defaults to 1)
    if (!id || !level || !type || !imageFile) {
      return NextResponse.json(
        { error: "Vui lòng nhập đầy đủ các trường dữ liệu bắt buộc và chọn tệp ảnh minh họa!" },
        { status: 400 }
      );
    }

    // Validate file size (Cloudinary free tier limit is 10MB for image/PDF uploads)
    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
    if (imageFile.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `Dung lượng tệp tin quá lớn (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). ` +
            `Cloudinary (Free Tier) giới hạn tải lên tệp PDF/ảnh tối đa là 10 MB. ` +
            `Admin vui lòng cắt riêng trang PDF chứa bài thi nói (thường chỉ < 1 MB) hoặc nén tệp PDF trước khi tải lên nhé! 📕`
        },
        { status: 400 }
      );
    }

    let part = 1;
    if (partStr) {
      part = parseInt(partStr, 10);
    } else if (id) {
      const match = id.match(/_P(\d+)_/i);
      if (match) {
        part = parseInt(match[1], 10);
      }
    }
    if (isNaN(part)) {
      return NextResponse.json(
        { error: "Số phần thi (Part) phải là một số nguyên hợp lệ!" },
        { status: 400 }
      );
    }

    if (!["Starters", "Movers", "Flyers"].includes(level)) {
      return NextResponse.json(
        { error: "Cấp độ thi phải nằm trong khoảng: Starters, Movers, Flyers" },
        { status: 400 }
      );
    }

    // Check unique key 'id'
    const duplicateQuestion = await Question.findOne({ id });
    if (duplicateQuestion) {
      return NextResponse.json(
        { error: `Mã ID học liệu '${id}' đã tồn tại trong database. Admin vui lòng đổi mã ID khác!` },
        { status: 400 }
      );
    }

    // 5. Parse tags lists from comma separation strings
    const contextTags = contextTagsRaw
      ? contextTagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const expectedKeywords = expectedKeywordsRaw
      ? expectedKeywordsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const targetGrammar = targetGrammarRaw
      ? targetGrammarRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    // 6. Read file to buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check if the uploaded file is a PDF
    const fileExtension = imageFile.name.split(".").pop()?.toLowerCase();
    const isPdf = fileExtension === "pdf" || imageFile.type === "application/pdf";

    // 7. Upload to Cloudinary using upload stream Promise
    const cloudinaryUploadResult = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "hubxanh_yle_pdf_digitalizer",
          public_id: `${id}_${Date.now()}`,
          resource_type: "image", // PDFs are uploaded as image resource type
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(buffer);
    });

    let imagePath = cloudinaryUploadResult.secure_url;
    if (isPdf && imagePath.endsWith(".pdf")) {
      // Dynamic rendering of PDF page 1 to a PNG image in Cloudinary
      imagePath = imagePath.replace(/\.pdf$/, ".png").replace("/image/upload/", "/image/upload/pg_1/");
    }

    // Parse questions list from JSON string if provided
    let questionsList = [];
    if (questionsRaw) {
      try {
        questionsList = JSON.parse(questionsRaw);
      } catch (e) {
        console.error("Lỗi parse questions list:", e);
      }
    }

    // Fallback if questions list is empty but individual examinerScript is provided
    if (questionsList.length === 0 && examinerScript) {
      questionsList = [
        {
          examinerScript,
          expectedKeywords,
          targetGrammar,
        },
      ];
    }

    // Ensure each sub-question has level, topic, and difficulty
      questionsList = questionsList.map((q: any, idx: number) => ({
        examinerScript: q.examinerScript || "",
        expectedKeywords: q.expectedKeywords || [],
        targetGrammar: q.targetGrammar || [],
        topic: q.topic || topic || "General",
        level: q.level || level || "Starters",
        difficulty: q.difficulty || (idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard"),
        groupCode: q.groupCode || "",
        groupName: q.groupName || "",
      }));

    // 8. Create Question document and save to database
    const newQuestion = new Question({
      id,
      level,
      part,
      type,
      imagePath,
      contextTags,
      topic,
      difficulty,
      examinerScript: examinerScript || (questionsList[0]?.examinerScript || ""),
      evaluationCriteria: {
        expectedKeywords: expectedKeywords || (questionsList[0]?.expectedKeywords || []),
        targetGrammar: targetGrammar || (questionsList[0]?.targetGrammar || []),
      },
      questions: questionsList,
    });

    await newQuestion.save();

    return NextResponse.json({
      success: true,
      message: "Đồng bộ học liệu bóc tách chuẩn Cambridge YLE vào cơ sở dữ liệu thành công! 🚀",
      data: newQuestion,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API POST questions:", error);
    return NextResponse.json(
      { error: "Lỗi đồng bộ hoặc upload ảnh lên Cloudinary: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT: Updates an existing question's metadata and optionally its image file
 */
export async function PUT(req: NextRequest) {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json(
        { error: "Không thể kết nối cơ sở dữ liệu MongoDB Atlas!" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const id = formData.get("id") as string;
    const level = formData.get("level") as "Starters" | "Movers" | "Flyers";
    const partStr = formData.get("part") as string;
    const type = formData.get("type") as string;
    const topic = (formData.get("topic") as string) || "General";
    const difficulty = ((formData.get("difficulty") as string) || "Medium") as "Easy" | "Medium" | "Hard";
    const examinerScript = formData.get("examinerScript") as string;
    const contextTagsRaw = formData.get("contextTags") as string;
    const expectedKeywordsRaw = formData.get("expectedKeywords") as string;
    const targetGrammarRaw = formData.get("targetGrammar") as string;
    const questionsRaw = formData.get("questions") as string;
    const imageFile = formData.get("image") as File | null;

    if (!id || !level || !type) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ các trường dữ liệu bắt buộc!" },
        { status: 400 }
      );
    }

    let part = 1;
    if (partStr) {
      part = parseInt(partStr, 10);
    } else if (id) {
      const match = id.match(/_P(\d+)_/i);
      if (match) {
        part = parseInt(match[1], 10);
      }
    }
    if (isNaN(part)) {
      return NextResponse.json(
        { error: "Số phần thi (Part) phải là một số nguyên hợp lệ!" },
        { status: 400 }
      );
    }

    if (!["Starters", "Movers", "Flyers"].includes(level)) {
      return NextResponse.json(
        { error: "Cấp độ thi phải nằm trong khoảng: Starters, Movers, Flyers" },
        { status: 400 }
      );
    }

    const existingQuestion = await Question.findOne({ id });
    if (!existingQuestion) {
      return NextResponse.json(
        { error: `Không tìm thấy câu hỏi có ID '${id}' để cập nhật!` },
        { status: 404 }
      );
    }

    // Parse lists
    const contextTags = contextTagsRaw
      ? contextTagsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const expectedKeywords = expectedKeywordsRaw
      ? expectedKeywordsRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const targetGrammar = targetGrammarRaw
      ? targetGrammarRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

    let imagePath = existingQuestion.imagePath;

    // Upload new image/PDF if provided
    if (imageFile && imageFile.size > 0) {
      // Validate file size (10MB limit)
      const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
      if (imageFile.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `Dung lượng tệp tin quá lớn (${(imageFile.size / 1024 / 1024).toFixed(1)} MB). ` +
              `Cloudinary (Free Tier) giới hạn tải lên tệp PDF/ảnh tối đa là 10 MB. ` +
              `Admin vui lòng cắt riêng trang PDF hoặc nén lại nhé! 📕`
          },
          { status: 400 }
        );
      }

      const arrayBuffer = await imageFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileExtension = imageFile.name.split(".").pop()?.toLowerCase();
      const isPdf = fileExtension === "pdf" || imageFile.type === "application/pdf";

      const cloudinaryUploadResult = await new Promise<any>((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            folder: "hubxanh_yle_pdf_digitalizer",
            public_id: `${id}_${Date.now()}`,
            resource_type: "image",
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imagePath = cloudinaryUploadResult.secure_url;
      if (isPdf && imagePath.endsWith(".pdf")) {
        imagePath = imagePath.replace(/\.pdf$/, ".png").replace("/image/upload/", "/image/upload/pg_1/");
      }
    }

    // Parse questions list
    let questionsList = [];
    if (questionsRaw) {
      try {
        questionsList = JSON.parse(questionsRaw);
      } catch (e) {
        console.error("Lỗi parse questions list:", e);
      }
    }

    // Fallback if questions list is empty but individual examinerScript is provided
    if (questionsList.length === 0 && examinerScript) {
      questionsList = [
        {
          examinerScript,
          expectedKeywords,
          targetGrammar,
        },
      ];
    }

    // Ensure each sub-question has level, topic, and difficulty
      questionsList = questionsList.map((q: any, idx: number) => ({
        examinerScript: q.examinerScript || "",
        expectedKeywords: q.expectedKeywords || [],
        targetGrammar: q.targetGrammar || [],
        topic: q.topic || topic || "General",
        level: q.level || level || "Starters",
        difficulty: q.difficulty || (idx < 2 ? "Easy" : idx < 4 ? "Medium" : "Hard"),
        groupCode: q.groupCode || "",
        groupName: q.groupName || "",
      }));

    // Apply updates
    existingQuestion.level = level as any;
    existingQuestion.part = part;
    existingQuestion.type = type;
    existingQuestion.imagePath = imagePath;
    existingQuestion.contextTags = contextTags;
    existingQuestion.topic = topic;
    existingQuestion.difficulty = difficulty;
    existingQuestion.examinerScript = examinerScript || (questionsList[0]?.examinerScript || "");
    existingQuestion.evaluationCriteria = {
      expectedKeywords: expectedKeywords || (questionsList[0]?.expectedKeywords || []),
      targetGrammar: targetGrammar || (questionsList[0]?.targetGrammar || []),
    };
    existingQuestion.questions = questionsList;

    await existingQuestion.save();

    return NextResponse.json({
      success: true,
      message: `Cập nhật học liệu mã '${id}' thành công! 🚀`,
      data: existingQuestion,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API PUT questions:", error);
    return NextResponse.json(
      { error: "Lỗi cập nhật dữ liệu học liệu: " + error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Deletes a question from MongoDB by its 'id' query parameter
 */
export async function DELETE(req: NextRequest) {
  try {
    const { isFallback } = await connectToDatabase();
    if (isFallback) {
      return NextResponse.json(
        { error: "Không thể kết nối cơ sở dữ liệu MongoDB Atlas!" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Vui lòng truyền tham số mã 'id' học liệu cần xóa!" },
        { status: 400 }
      );
    }

    const deletedQuestion = await Question.findOneAndDelete({ id });
    if (!deletedQuestion) {
      return NextResponse.json(
        { error: `Không tìm thấy học liệu có mã ID '${id}' để tiến hành xóa!` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa thành công học liệu mã '${id}' khỏi cơ sở dữ liệu! 🗑️`,
    });
  } catch (error: any) {
    console.error("❌ Lỗi API DELETE questions:", error);
    return NextResponse.json(
      { error: "Không thể xóa học liệu: " + error.message },
      { status: 500 }
    );
  }
}

