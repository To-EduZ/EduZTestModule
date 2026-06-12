const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const cloudinary = require("cloudinary").v2;

let mongodbUri = "";
let cloudinaryConfig = {
  cloud_name: "",
  api_key: "",
  api_secret: ""
};

try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    
    // Parse MONGODB_URI
    const dbMatch = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (dbMatch && dbMatch[1]) {
      mongodbUri = dbMatch[1].trim();
    }
    
    // Parse Cloudinary configuration
    const cloudNameMatch = envContent.match(/^CLOUDINARY_CLOUD_NAME=(.+)$/m);
    const apiKeyMatch = envContent.match(/^CLOUDINARY_API_KEY=(.+)$/m);
    const apiSecretMatch = envContent.match(/^CLOUDINARY_API_SECRET=(.+)$/m);
    
    if (cloudNameMatch && cloudNameMatch[1]) cloudinaryConfig.cloud_name = cloudNameMatch[1].trim();
    if (apiKeyMatch && apiKeyMatch[1]) cloudinaryConfig.api_key = apiKeyMatch[1].trim();
    if (apiSecretMatch && apiSecretMatch[1]) cloudinaryConfig.api_secret = apiSecretMatch[1].trim();
  }
} catch (e) {
  console.log("⚠️ Không thể đọc file .env để lấy cấu hình.");
}

if (!mongodbUri) {
  console.error("❌ Không tìm thấy MONGODB_URI trong .env!");
  process.exit(1);
}

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
  console.error("❌ Không tìm thấy đầy đủ CLOUDINARY credentials trong .env!");
  process.exit(1);
}

console.log("☁️ Đang cấu hình Cloudinary...");
cloudinary.config(cloudinaryConfig);
console.log(`✅ Cloudinary Cloud Name: ${cloudinaryConfig.cloud_name}`);
console.log(`🔌 Đang kết nối tới MongoDB Atlas: ${mongodbUri.split("@")[1] || mongodbUri}`);

// MongoDB schemas
const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    age: { type: Number, required: true },
    currentLevel: { type: String, enum: ["Starters", "Movers", "Flyers"], default: "Starters" },
    totalStars: { type: Number, default: 0 },
    className: { type: String },
    schoolName: { type: String },
  },
  { timestamps: true }
);

const AssessmentResultSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    level: { type: String, enum: ["Starters", "Movers", "Flyers"], required: true },
    skill: { type: String, enum: ["Speaking", "Listening", "Reading", "Writing"], default: "Speaking", required: true },
    sentence: { type: String, required: true },
    score: { type: Number, required: true, min: 0, max: 100 },
    stars: { type: Number, required: true, min: 1, max: 5 },
    feedback: {
      tutorComment: { type: String, required: true },
      tips: { type: String, default: "" },
    },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const QuestionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  level: { type: String, enum: ["Starters", "Movers", "Flyers"], required: true },
  part: { type: Number, required: true },
  type: { type: String, required: true },
  imagePath: { type: String, required: true },
  contextTags: { type: [String], default: [] },
  topic: { type: String, default: "General" },
  difficulty: {
    type: String,
    enum: ["Easy", "Medium", "Hard"],
    default: "Medium"
  },
  examinerScript: { type: String, required: false },
  evaluationCriteria: {
    expectedKeywords: { type: [String], default: [] },
    targetGrammar: { type: [String], default: [] },
  },
  questions: {
    type: [
      {
        examinerScript: { type: String, required: true },
        expectedKeywords: { type: [String], default: [] },
        targetGrammar: { type: [String], default: [] },
        topic: { type: String },
        level: {
          type: String,
          enum: ["Starters", "Movers", "Flyers"],
        },
        difficulty: {
          type: String,
          enum: ["Easy", "Medium", "Hard"],
        },
      },
    ],
    default: [],
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const AssessmentResult = mongoose.models.AssessmentResult || mongoose.model("AssessmentResult", AssessmentResultSchema);
const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

// Seeding constants
const schools = ["TH Nguyễn Trãi", "TH Lê Quý Đôn", "TH Trần Quốc Toản"];
const classesBySchool = {
  "TH Nguyễn Trãi": ["3A1", "3A2"],
  "TH Lê Quý Đôn": ["4A1", "4A2"],
  "TH Trần Quốc Toản": ["5A1", "5A2"]
};
const skills = ["Speaking", "Listening", "Reading", "Writing"];
const levels = ["Starters", "Movers", "Flyers"];

const generateUsers = () => {
  const users = [];
  let userIdx = 1;
  for (const school of schools) {
    for (const className of classesBySchool[school]) {
      // 15 students per class => 90 students total
      for (let i = 0; i < 15; i++) {
        users.push({
          name: `Học sinh ${school.split(" ")[1]} ${userIdx++}`,
          age: parseInt(className[0]) + 5, // e.g. 3A1 => 8 years old
          currentLevel: levels[Math.floor(Math.random() * levels.length)],
          totalStars: Math.floor(Math.random() * 50) + 10,
          className,
          schoolName: school,
        });
      }
    }
  }
  return users;
};

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

// Sample original questions with locally generated image paths
const originalQuestions = [
  {
    id: "ST_P1_47",
    level: "Starters",
    part: 1,
    type: "Scene_Description",
    localPath: "/home/okarin/.gemini/antigravity/brain/d5c83dce-4958-4ac8-8254-e3e7de19d383/playground_illustration_1781262351961.png",
    contextTags: ["restored", "starters"],
    topic: "Playground",
    difficulty: "Medium",
    examinerScript: "Look at this picture. Tell me what you see.",
    evaluationCriteria: { expectedKeywords: ["boy", "girl"], targetGrammar: [] },
    questions: [
      {
        examinerScript: "Look at this picture. Tell me what you see.",
        expectedKeywords: ["boy", "girl", "children"],
        targetGrammar: [],
        topic: "Playground",
        level: "Starters",
        difficulty: "Easy"
      },
      {
        examinerScript: "Where is the dog?",
        expectedKeywords: ["dog", "near the boy", "on the grass"],
        targetGrammar: ["prepositions"],
        topic: "Playground",
        level: "Starters",
        difficulty: "Easy"
      },
      {
        examinerScript: "What is the girl playing with?",
        expectedKeywords: ["ball", "red ball", "toy"],
        targetGrammar: ["present continuous"],
        topic: "Playground",
        level: "Starters",
        difficulty: "Medium"
      },
      {
        examinerScript: "How many trees can you count?",
        expectedKeywords: ["two trees", "trees", "two"],
        targetGrammar: ["there are", "numbers"],
        topic: "Playground",
        level: "Starters",
        difficulty: "Medium"
      },
      {
        examinerScript: "What is the boy wearing?",
        expectedKeywords: ["blue T-shirt", "T-shirt", "blue"],
        targetGrammar: ["present continuous", "colors"],
        topic: "Playground",
        level: "Starters",
        difficulty: "Hard"
      }
    ]
  },
  {
    id: "MV_P2_47",
    level: "Movers",
    part: 2,
    type: "Storytelling",
    localPath: "/home/okarin/.gemini/antigravity/brain/d5c83dce-4958-4ac8-8254-e3e7de19d383/monkey_jungle_story_1781262370568.png",
    contextTags: ["restored", "movers"],
    topic: "Animals",
    difficulty: "Medium",
    examinerScript: "This is a story. Can you tell it to me?",
    evaluationCriteria: { expectedKeywords: ["story"], targetGrammar: [] },
    questions: [
      {
        examinerScript: "This is a story. Can you tell it to me?",
        expectedKeywords: ["story", "monkey", "jungle"],
        targetGrammar: [],
        topic: "Animals",
        level: "Movers",
        difficulty: "Easy"
      },
      {
        examinerScript: "What happened first in the story?",
        expectedKeywords: ["monkey stole the hat", "stole the hat", "hat"],
        targetGrammar: ["past simple"],
        topic: "Animals",
        level: "Movers",
        difficulty: "Easy"
      },
      {
        examinerScript: "Where did the monkey go?",
        expectedKeywords: ["up the tree", "tree", "climbed"],
        targetGrammar: ["past simple"],
        topic: "Animals",
        level: "Movers",
        difficulty: "Medium"
      },
      {
        examinerScript: "How did the man feel about his hat?",
        expectedKeywords: ["angry", "sad", "surprised"],
        targetGrammar: ["past simple", "adjectives"],
        topic: "Animals",
        level: "Movers",
        difficulty: "Medium"
      },
      {
        examinerScript: "How did the story end?",
        expectedKeywords: ["got the hat back", "happy man", "end"],
        targetGrammar: ["past simple"],
        topic: "Animals",
        level: "Movers",
        difficulty: "Hard"
      }
    ]
  },
  {
    id: "MV_P3_47",
    level: "Movers",
    part: 3,
    type: "Find_Differences",
    localPath: "/home/okarin/.gemini/antigravity/brain/d5c83dce-4958-4ac8-8254-e3e7de19d383/find_differences_house_1781262384953.png",
    contextTags: ["restored", "movers"],
    topic: "General",
    difficulty: "Medium",
    examinerScript: "Find the differences between these two pictures.",
    evaluationCriteria: { expectedKeywords: ["different"], targetGrammar: [] },
    questions: [
      {
        examinerScript: "Find the differences between these two pictures.",
        expectedKeywords: ["different", "two pictures"],
        targetGrammar: [],
        topic: "General",
        level: "Movers",
        difficulty: "Easy"
      },
      {
        examinerScript: "What is different about the weather?",
        expectedKeywords: ["raining in picture A", "sunny in picture B", "rain", "sun"],
        targetGrammar: ["present continuous", "present simple"],
        topic: "General",
        level: "Movers",
        difficulty: "Easy"
      },
      {
        examinerScript: "Look at the animals. What differences do you see?",
        expectedKeywords: ["two cats", "one cat", "dog", "no dog"],
        targetGrammar: ["there is", "there are"],
        topic: "General",
        level: "Movers",
        difficulty: "Medium"
      },
      {
        examinerScript: "Compare the boy's clothes in both pictures.",
        expectedKeywords: ["red sweater", "blue jacket", "different sweater"],
        targetGrammar: ["adjectives", "present continuous"],
        topic: "General",
        level: "Movers",
        difficulty: "Medium"
      },
      {
        examinerScript: "What about the window in the house?",
        expectedKeywords: ["open window", "closed window", "open", "closed"],
        targetGrammar: ["present simple"],
        topic: "General",
        level: "Movers",
        difficulty: "Hard"
      }
    ]
  }
];

async function seedAll() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("✅ Đã kết nối thành công tới MongoDB Atlas!");

    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await User.deleteMany({});
    await AssessmentResult.deleteMany({});
    await Question.deleteMany({});
    console.log("✅ Đã xóa các bảng User, AssessmentResult và Question cũ.");

    // 1. Seed Users
    console.log("🌱 Đang tạo 90 Users...");
    const mockUsers = generateUsers();
    const createdUsers = await User.insertMany(mockUsers);
    console.log(`✅ Đã tạo thành công ${createdUsers.length} users.`);

    // 2. Seed Assessment Results
    console.log("🌱 Đang tạo ~1000 Assessment Results...");
    const mockResults = [];
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    for (const user of createdUsers) {
      const numSessions = Math.floor(Math.random() * 8) + 12;
      let currentBaseScore = Math.floor(Math.random() * 30) + 40; // Start between 40-70
      
      const sessionDates = [];
      for (let i = 0; i < numSessions; i++) {
        sessionDates.push(randomDate(threeMonthsAgo, now));
      }
      sessionDates.sort((a, b) => a - b); // chronological

      for (let i = 0; i < numSessions; i++) {
        currentBaseScore = Math.min(95, currentBaseScore + (Math.random() * 5));
        
        for (const skill of skills) {
          let variance = (Math.random() * 20) - 10;
          let score = Math.round(currentBaseScore + variance);
          score = Math.max(0, Math.min(100, score)); // clamp 0-100
          
          let stars = 5;
          if (score < 30) stars = 1;
          else if (score < 50) stars = 2;
          else if (score < 70) stars = 3;
          else if (score < 85) stars = 4;

          mockResults.push({
            userId: user._id.toString(),
            level: user.currentLevel,
            skill,
            sentence: `Test câu mẫu cho kỹ năng ${skill}`,
            score,
            stars,
            feedback: {
              tutorComment: `Phân tích AI cho kỹ năng ${skill} của bé.`,
            },
            createdAt: sessionDates[i]
          });
        }
      }
    }

    const createdResults = await AssessmentResult.insertMany(mockResults);
    console.log(`✅ Đã tạo thành công ${createdResults.length} kết quả bài test.`);

    // 3. Upload Local Generated Images to User's Cloudinary & Seed Questions
    console.log("🌱 Đang tải các ảnh sample lên Cloudinary của bạn...");
    const seededQuestions = [];

    for (const q of originalQuestions) {
      console.log(`📤 Đang tải ảnh cho câu hỏi ${q.id} từ file cục bộ: ${q.localPath}...`);
      
      const uploadResponse = await cloudinary.uploader.upload(q.localPath, {
        folder: "hubxanh_yle_pdf_digitalizer",
        public_id: `${q.id}_seed`,
        overwrite: true
      });
      
      console.log(`✅ Đã tải lên Cloudinary thành công! URL mới: ${uploadResponse.secure_url}`);
      
      seededQuestions.push({
        id: q.id,
        level: q.level,
        part: q.part,
        type: q.type,
        imagePath: uploadResponse.secure_url,
        contextTags: q.contextTags,
        topic: q.topic,
        difficulty: q.difficulty,
        examinerScript: q.examinerScript,
        evaluationCriteria: q.evaluationCriteria,
        questions: q.questions
      });
    }

    console.log("🌱 Đang lưu trữ các câu hỏi sample vào Database...");
    const createdQuestions = await Question.insertMany(seededQuestions);
    console.log(`✅ Đã lưu trữ thành công ${createdQuestions.length} câu hỏi sample.`);

    console.log("\n🎉 SEED DỮ LIỆU THÀNH CÔNG RỰC RỠ! 🚀");
  } catch (error) {
    console.error("❌ Gặp sự cố:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối.");
    process.exit(0);
  }
}

seedAll();
