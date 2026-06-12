const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let mongodbUri = "";

try {
  // Try .env first (module's own database)
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

console.log(`🔌 Đang kết nối tới MongoDB Atlas: ${mongodbUri.split("@")[1] || mongodbUri}`);

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

const User = mongoose.models.User || mongoose.model("User", UserSchema);
const AssessmentResult = mongoose.models.AssessmentResult || mongoose.model("AssessmentResult", AssessmentResultSchema);

// Constants for Generation
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

// Helper: Get random date between two dates
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("✅ Đã kết nối thành công tới MongoDB Atlas!");

    console.log("🧹 Đang dọn dẹp dữ liệu cũ...");
    await User.deleteMany({});
    await AssessmentResult.deleteMany({});
    
    console.log("🌱 Đang tạo 30 Users...");
    const mockUsers = generateUsers();
    const createdUsers = await User.insertMany(mockUsers);
    
    console.log("🌱 Đang tạo ~300 Assessment Results...");
    const mockResults = [];
    
    const now = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    for (const user of createdUsers) {
      // Generate 12-20 test sessions for each user over 3 months
      const numSessions = Math.floor(Math.random() * 8) + 12;
      
      // Base score curve (improvement over time)
      let currentBaseScore = Math.floor(Math.random() * 30) + 40; // Start between 40-70
      
      const sessionDates = [];
      for (let i=0; i<numSessions; i++) {
        sessionDates.push(randomDate(threeMonthsAgo, now));
      }
      sessionDates.sort((a,b) => a - b); // chronological

      for (let i = 0; i < numSessions; i++) {
        // Increase base score gradually, max 95
        currentBaseScore = Math.min(95, currentBaseScore + (Math.random() * 5));
        
        for (const skill of skills) {
          // Variance for each skill
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
    console.log(`📈 Đã tạo thành công ${createdUsers.length} users và ${createdResults.length} kết quả bài test (khoảng 3 tháng)!`);

    console.log("\n🎉 Seed dữ liệu thành công rực rỡ! 🚀");
  } catch (error) {
    console.error("❌ Gặp sự cố:", error);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Đã ngắt kết nối.");
    process.exit(0);
  }
}

seed();
