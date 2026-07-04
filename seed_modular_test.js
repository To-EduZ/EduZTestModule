const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let mongodbUri = "";

try {
  // Try .env first
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const match = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (match && match[1]) {
      mongodbUri = match[1].trim();
    }
  }
  // Fallback to .env.local
  if (!mongodbUri) {
    const envLocalPath = path.join(__dirname, ".env.local");
    if (fs.existsSync(envLocalPath)) {
      const envContent = fs.readFileSync(envLocalPath, "utf8");
      const match = envContent.match(/^MONGODB_URI=(.+)$/m);
      if (match && match[1]) {
        mongodbUri = match[1].trim();
      }
    }
  }
} catch (e) {
  console.log("⚠️ Không thể đọc file .env, sử dụng chuỗi kết nối mặc định.");
}

if (!mongodbUri) {
  console.error("❌ Không tìm thấy MONGODB_URI trong .env!");
  process.exit(1);
}

console.log(`🔌 Đang kết nối tới MongoDB: ${mongodbUri.split("@")[1] || mongodbUri}`);

// Define Schemas
const TestSectionSchema = new mongoose.Schema({
  type: { type: String, required: true },
  name: { type: String, required: true },
  timeLimit: { type: Number },
  questionIds: { type: [String], default: [] },
  config: {
    picCount: { type: Number },
    wordCount: { type: Number },
    aiPromptOverride: { type: String }
  }
}, { _id: false });

const TestPaperSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    moduleType: { type: String, required: true },
    status: { type: String, default: "draft" },
    testCode: { type: String },
    centerId: { type: String },
    questionIds: { type: [String], default: [] },
    sections: { type: [TestSectionSchema], default: [] }
  },
  { timestamps: true }
);

const InteractiveSessionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    testCode: { type: String, default: "" },
    testPaperId: { type: String, default: "" },
    kidName: { type: String, required: true },
    kidAge: { type: Number, required: true },
    testKidName: { type: String },
    testKidAge: { type: Number },
    scores: {
      speaking: { type: Number, required: true },
      listening: { type: Number, required: true },
      reading: { type: Number, required: true },
      writing: { type: Number, required: true }
    },
    chatHistory: { type: Array, default: [] },
    studentStars: { type: Number, default: null },
    overallLevel: { type: String, required: true }
  },
  { timestamps: true }
);

const TestPaper = mongoose.models.TestPaper || mongoose.model("TestPaper", TestPaperSchema);
const InteractiveSession = mongoose.models.InteractiveSession || mongoose.model("InteractiveSession", InteractiveSessionSchema);

async function run() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("✅ Kết nối cơ sở dữ liệu thành công!");

    // 1. MIGRATION: Cập nhật các đề thi cũ sang định dạng mới
    console.log("🔄 Bắt đầu chạy Migration cho các đề thi cũ...");
    const oldPapers = await TestPaper.find({
      $or: [
        { sections: { $exists: false } },
        { sections: { $size: 0 } }
      ]
    });
    console.log(`🔎 Tìm thấy ${oldPapers.length} đề thi cần cập nhật cấu trúc.`);
    
    for (const paper of oldPapers) {
      const qIds = paper.questionIds || [];
      const sections = [
        {
          type: "warmup",
          name: "Khởi động (Warm-up)",
          questionIds: []
        },
        {
          type: "picture",
          name: "Miêu tả tranh (Picture)",
          questionIds: qIds,
          config: { picCount: Math.min(2, qIds.length || 2) }
        },
        {
          type: "reading",
          name: "Tập đọc (Reading)",
          questionIds: []
        },
        {
          type: "writing",
          name: "Đánh vần (Spelling)",
          questionIds: []
        }
      ];
      
      paper.sections = sections;
      await paper.save();
      console.log(`⚡ Đã cập nhật đề thi: ${paper.id}`);
    }

    // 2. SEEDING: Tạo đề thi modular mẫu cho Trung tâm A
    console.log("🌱 Bắt đầu tạo đề thi mẫu CLASS_A_MIDTERM...");
    
    // Xóa đề cũ trùng mã nếu có
    await TestPaper.deleteOne({ id: "TEST_CLASS_A" });
    
    const modularPaper = new TestPaper({
      id: "TEST_CLASS_A",
      name: "Đề thi giữa kỳ lớp Movers - Trung tâm A",
      moduleType: "interactive",
      status: "published",
      testCode: "CLASS_A_MIDTERM",
      centerId: "CENTER_A",
      sections: [
        {
          type: "warmup",
          name: "Khởi động cùng cô giáo AI Lily",
          timeLimit: 120,
          questionIds: []
        },
        {
          type: "picture",
          name: "Quan sát tranh và mô tả chi tiết",
          timeLimit: 300,
          questionIds: ["MV_P1_57", "MV_P1_87"], // Movers Questions
          config: {
            picCount: 2
          }
        },
        {
          type: "reading",
          name: "Đọc to câu chuyện & Trắc nghiệm MCQ",
          timeLimit: 180,
          questionIds: [],
          config: {
            wordCount: 80,
            aiPromptOverride: "Tạo câu chuyện dài hơn (khoảng 80 từ) và hài hước hơn về chú khỉ Max tinh nghịch, liên kết với tranh thời tiết và chú mèo."
          }
        },
        {
          type: "writing",
          name: "Đố vui đánh vần từ vựng",
          timeLimit: 180,
          questionIds: []
        }
      ],
      questionIds: ["MV_P1_57", "MV_P1_87"]
    });

    await modularPaper.save();
    console.log("✅ Đã tạo đề thi mẫu TEST_CLASS_A thành công!");

    // 3. SEEDING: Tạo các kết quả thi mẫu cho mã CLASS_A_MIDTERM
    console.log("🌱 Bắt đầu tạo kết quả làm bài mẫu của học sinh...");
    
    await InteractiveSession.deleteMany({ testCode: "CLASS_A_MIDTERM" });

    const dummySessions = [
      {
        userId: "kid_student_001",
        testCode: "CLASS_A_MIDTERM",
        testPaperId: "TEST_CLASS_A",
        kidName: "Nguyễn Hải Đăng",
        kidAge: 8,
        testKidName: "Hải Đăng",
        testKidAge: 8,
        scores: {
          speaking: 85,
          listening: 75,
          reading: 90,
          writing: 80
        },
        studentStars: 5,
        overallLevel: "Movers (A1)",
        createdAt: new Date(Date.now() - 3600000 * 2) // 2 hours ago
      },
      {
        userId: "kid_student_002",
        testCode: "CLASS_A_MIDTERM",
        testPaperId: "TEST_CLASS_A",
        kidName: "Trần Minh Khang",
        kidAge: 8,
        testKidName: "Minh Khang",
        testKidAge: 8,
        scores: {
          speaking: 65,
          listening: 70,
          reading: 60,
          writing: 68
        },
        studentStars: 4,
        overallLevel: "Movers (A1)",
        createdAt: new Date(Date.now() - 3600000 * 1.5) // 1.5 hours ago
      },
      {
        userId: "kid_student_003",
        testCode: "CLASS_A_MIDTERM",
        testPaperId: "TEST_CLASS_A",
        kidName: "Lê Mỹ Dung",
        kidAge: 9,
        testKidName: "Mỹ Dung",
        testKidAge: 9,
        scores: {
          speaking: 95,
          listening: 90,
          reading: 95,
          writing: 92
        },
        studentStars: 5,
        overallLevel: "Flyers (A2)",
        createdAt: new Date(Date.now() - 3600000 * 1) // 1 hour ago
      },
      {
        userId: "kid_student_004",
        testCode: "CLASS_A_MIDTERM",
        testPaperId: "TEST_CLASS_A",
        kidName: "Phạm Hà Phương",
        kidAge: 7,
        testKidName: "Hà Phương",
        testKidAge: 7,
        scores: {
          speaking: 55,
          listening: 50,
          reading: 45,
          writing: 48
        },
        studentStars: null, // No rating
        overallLevel: "Starters (Pre-A1)",
        createdAt: new Date(Date.now() - 3600000 * 0.5) // 30 mins ago
      }
    ];

    await InteractiveSession.insertMany(dummySessions);
    console.log("✅ Đã tạo thành công 4 bài thi mẫu của học sinh!");

    console.log("\n🎉 HOÀN THÀNH MIGRATION & SEEDING DỮ LIỆU!");
  } catch (err) {
    console.error("❌ Lỗi trong quá trình chạy script:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối cơ sở dữ liệu.");
  }
}

run();
