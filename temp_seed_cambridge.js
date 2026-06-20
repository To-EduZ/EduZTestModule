const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

let mongodbUri = "mongodb+srv://EduZ3667:naobo2@englishkidsapp.hyzcoyq.mongodb.net/english-kids-app?appName=EnglishKidsApp";

try {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, "utf8");
    const dbMatch = envContent.match(/^MONGODB_URI=(.+)$/m);
    if (dbMatch && dbMatch[1]) {
      mongodbUri = dbMatch[1].trim();
    }
  }
} catch (e) {
  console.log("⚠️ Could not read .env file, using default connection string.");
}

console.log(`🔌 Connecting to MongoDB: ${mongodbUri.split("@")[1] || mongodbUri}`);

// Schemas
const CambridgeQuestionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    section: { 
      type: String, 
      enum: ["language-use", "listening"], 
      required: true 
    },
    part: { type: Number, required: true },
    taskNumber: { type: Number, required: true },
    questionNumberInTask: { type: Number, required: true },
    type: { type: String, required: true },
    testingFocus: { type: String, required: true },
    
    dialogue: { type: String, required: false },
    passage: { type: String, required: false },
    gapLabel: { type: String, required: false },
    audioText: { type: String, required: false },
    
    questionText: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    images: { type: [String], required: false, default: [] },
  },
  { timestamps: true }
);

const TestPaperSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    moduleType: { type: String, enum: ["interactive", "yle"], required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    questionIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

const AppConfigSchema = new mongoose.Schema(
  {
    singletonId: { type: String, required: true, unique: true },
    interactiveMode: { type: String, enum: ["random", "fixed"], default: "random" },
    interactiveFixedTestId: { type: String, default: "" },
    yleMode: { type: String, enum: ["random", "fixed"], default: "random" },
    yleFixedTestId: { type: String, default: "" },
  },
  { timestamps: true }
);

const CambridgeQuestion = mongoose.models.CambridgeQuestion || mongoose.model("CambridgeQuestion", CambridgeQuestionSchema);
const TestPaper = mongoose.models.TestPaper || mongoose.model("TestPaper", TestPaperSchema);
const AppConfig = mongoose.models.AppConfig || mongoose.model("AppConfig", AppConfigSchema);

// Questions Dataset
const mockQuestions = [
  // ─── LANGUAGE USE: Part 1 - Vocabulary (dialogue-mcq) ───
  {
    id: "LU_P1_01",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - Animals",
    dialogue: "A: Look! What is that animal in the tree?\nB: It is a _____.",
    questionText: "Choose the correct animal.",
    options: ["monkey", "fish", "elephant"],
    correctAnswer: "monkey"
  },
  {
    id: "LU_P1_02",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 2,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - Fruits",
    dialogue: "A: Would you like a fruit?\nB: Yes, please. I'd like a yellow _____.",
    questionText: "Choose the correct fruit.",
    options: ["apple", "banana", "watermelon"],
    correctAnswer: "banana"
  },
  {
    id: "LU_P1_03",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 3,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - Transport",
    dialogue: "A: How do you go to school?\nB: I go by _____.",
    questionText: "Choose the correct vehicle.",
    options: ["bus", "house", "desk"],
    correctAnswer: "bus"
  },
  {
    id: "LU_P1_04",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 4,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - Sports",
    dialogue: "A: What is your favorite sport?\nB: I like playing _____ with my friends.",
    questionText: "Choose the correct sport.",
    options: ["soccer", "piano", "ice cream"],
    correctAnswer: "soccer"
  },
  {
    id: "LU_P1_05",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 5,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - Colors",
    dialogue: "A: What color is the sky today?\nB: It is _____.",
    questionText: "Choose the correct color.",
    options: ["red", "blue", "green"],
    correctAnswer: "blue"
  },
  {
    id: "LU_P1_06",
    section: "language-use",
    part: 1,
    taskNumber: 1,
    questionNumberInTask: 6,
    type: "dialogue-mcq",
    testingFocus: "Vocabulary - School objects",
    dialogue: "A: Can you lend me your _____?\nB: Sure, here is my pen.",
    questionText: "Choose the correct school object.",
    options: ["pencil", "chairbox", "window"],
    correctAnswer: "pencil"
  },

  // ─── LANGUAGE USE: Part 2 - Functional Language (dialogue-mcq) ───
  {
    id: "LU_P2_01",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 1,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Greeting",
    dialogue: "A: Hello! My name is Tom.\nB: _____",
    questionText: "Choose the best response.",
    options: ["Nice to meet you, Tom.", "Thank you very much.", "I'm ten years old."],
    correctAnswer: "Nice to meet you, Tom."
  },
  {
    id: "LU_P2_02",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 2,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Age",
    dialogue: "A: How old are you, Lucy?\nB: _____",
    questionText: "Choose the best response.",
    options: ["I am fine, thanks.", "I am nine years old.", "I live in Hanoi."],
    correctAnswer: "I am nine years old."
  },
  {
    id: "LU_P2_03",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 3,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Requesting help",
    dialogue: "A: Can you help me carry this box?\nB: _____",
    questionText: "Choose the best response.",
    options: ["Sure, no problem!", "Yes, I like boxes.", "Goodbye!"],
    correctAnswer: "Sure, no problem!"
  },
  {
    id: "LU_P2_04",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 4,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Apologizing",
    dialogue: "A: Oh, I'm sorry! I broke your toy.\nB: _____",
    questionText: "Choose the best response.",
    options: ["That's okay. Don't worry.", "You are welcome.", "Yes, it is mine."],
    correctAnswer: "That's okay. Don't worry."
  },
  {
    id: "LU_P2_05",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 5,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Offering",
    dialogue: "A: Would you like some water?\nB: _____",
    questionText: "Choose the best response.",
    options: ["No, thank you. I'm not thirsty.", "Yes, I am hot.", "Water is blue."],
    correctAnswer: "No, thank you. I'm not thirsty."
  },
  {
    id: "LU_P2_06",
    section: "language-use",
    part: 2,
    taskNumber: 2,
    questionNumberInTask: 6,
    type: "dialogue-mcq",
    testingFocus: "Social Interaction - Opinion",
    dialogue: "A: Do you think this movie is good?\nB: _____",
    questionText: "Choose the best response.",
    options: ["Yes, it is very exciting!", "No, I didn't see it yesterday.", "It's at 8 PM."],
    correctAnswer: "Yes, it is very exciting!"
  },

  // ─── LANGUAGE USE: Part 3 - Grammar (gapped-text) ───
  // Sharing the same passage
  {
    id: "LU_P3_01",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 1,
    type: "gapped-text",
    testingFocus: "Grammar - Past Simple verb form",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(1)",
    questionText: "Choose the correct word for gap (1).",
    options: ["saw", "see", "seeing"],
    correctAnswer: "saw"
  },
  {
    id: "LU_P3_02",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 2,
    type: "gapped-text",
    testingFocus: "Grammar - Past Continuous auxiliary",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(2)",
    questionText: "Choose the correct word for gap (2).",
    options: ["were", "was", "are"],
    correctAnswer: "were"
  },
  {
    id: "LU_P3_03",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 3,
    type: "gapped-text",
    testingFocus: "Grammar - Present/Past Continuous participle",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(3)",
    questionText: "Choose the correct word for gap (3).",
    options: ["walking", "walked", "walks"],
    correctAnswer: "walking"
  },
  {
    id: "LU_P3_04",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 4,
    type: "gapped-text",
    testingFocus: "Grammar - Past Simple irregular verb",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(4)",
    questionText: "Choose the correct word for gap (4).",
    options: ["bought", "buy", "buying"],
    correctAnswer: "bought"
  },
  {
    id: "LU_P3_05",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 5,
    type: "gapped-text",
    testingFocus: "Grammar - Past singular copula",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(5)",
    questionText: "Choose the correct word for gap (5).",
    options: ["was", "is", "were"],
    correctAnswer: "was"
  },
  {
    id: "LU_P3_06",
    section: "language-use",
    part: 3,
    taskNumber: 3,
    questionNumberInTask: 6,
    type: "gapped-text",
    testingFocus: "Grammar - Past Simple feeling",
    passage: "Yesterday, my family went to the zoo. We __(1)__ many animals there. My brother liked the monkeys because they __(2)__ eating bananas. A big elephant was __(3)__ slowly. We __(4)__ some ice cream and sat near the lake. It __(5)__ a beautiful day. We came home at 5 PM and __(6)__ very happy.",
    gapLabel: "(6)",
    questionText: "Choose the correct word for gap (6).",
    options: ["felt", "feel", "feeling"],
    correctAnswer: "felt"
  },

  // ─── LISTENING: Part 1 - Image Selection (listening-image) ───
  {
    id: "L_P1_01",
    section: "listening",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 1,
    type: "listening-image",
    testingFocus: "Listening - Identifications",
    audioText: "Look at the children. The boy is flying a colorful kite in the park.",
    questionText: "Which is the boy?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "https://images.unsplash.com/photo-1503919545889-aef636e10ad4?w=250&h=250&fit=crop", // boy flying kite
      "https://images.unsplash.com/photo-1485546246426-74dc88dec4d9?w=250&h=250&fit=crop", // girl doll
      "https://images.unsplash.com/photo-1519238263530-99bdd11df2ea?w=250&h=250&fit=crop"  // boy reading
    ]
  },
  {
    id: "L_P1_02",
    section: "listening",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 2,
    type: "listening-image",
    testingFocus: "Listening - Prepositions",
    audioText: "Where is the cat? Oh, it is sleeping inside a small cardboard box.",
    questionText: "Where is the cat?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "https://images.unsplash.com/photo-1574158622643-69d34d72650a?w=250&h=250&fit=crop", // cat in box
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=250&h=250&fit=crop", // cat on chair
      "https://images.unsplash.com/photo-1548247416-ec66f4900b2e?w=250&h=250&fit=crop"  // cat under table
    ]
  },
  {
    id: "L_P1_03",
    section: "listening",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 3,
    type: "listening-image",
    testingFocus: "Listening - Action verbs",
    audioText: "Listen! The small bird is singing beautifully on the tree branch.",
    questionText: "What is the bird doing?",
    options: ["A", "B", "C"],
    correctAnswer: "A",
    images: [
      "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=250&h=250&fit=crop", // bird singing
      "https://images.unsplash.com/photo-1470115636472-88b39c7ee7b5?w=250&h=250&fit=crop", // bird flying
      "https://images.unsplash.com/photo-1551085254-e96b210db58a?w=250&h=250&fit=crop"  // bird eating
    ]
  },
  {
    id: "L_P1_04",
    section: "listening",
    part: 1,
    taskNumber: 4,
    questionNumberInTask: 4,
    type: "listening-image",
    testingFocus: "Listening - Vocabulary",
    audioText: "I like bananas best because they are sweet and yellow.",
    questionText: "Which fruit is yellow?",
    options: ["A", "B", "C"],
    correctAnswer: "B",
    images: [
      "https://images.unsplash.com/photo-1550258987-190a2d41a8ba?w=250&h=250&fit=crop", // pineapple
      "https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=250&h=250&fit=crop", // banana
      "https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?w=250&h=250&fit=crop"  // apple
    ]
  },

  // ─── LISTENING: Part 2 - Multiple Choice (listening-mcq) ───
  {
    id: "L_P2_01",
    section: "listening",
    part: 2,
    taskNumber: 5,
    questionNumberInTask: 1,
    type: "listening-mcq",
    testingFocus: "Listening - Food Preferences",
    audioText: "Boy: Do you like chicken, Lucy? Girl: No, I like pizza best! Boy: Me too, pizza is delicious.",
    questionText: "What is the girl's favorite food?",
    options: ["Pizza", "Chicken", "Fish"],
    correctAnswer: "Pizza"
  },
  {
    id: "L_P2_02",
    section: "listening",
    part: 2,
    taskNumber: 5,
    questionNumberInTask: 2,
    type: "listening-mcq",
    testingFocus: "Listening - Locations",
    audioText: "Girl: Where is Dad? Is he in the living room? Boy: No, he is cooking in the kitchen.",
    questionText: "Where is Dad?",
    options: ["In the kitchen", "In the living room", "In the garden"],
    correctAnswer: "In the kitchen"
  },
  {
    id: "L_P2_03",
    section: "listening",
    part: 2,
    taskNumber: 5,
    questionNumberInTask: 3,
    type: "listening-mcq",
    testingFocus: "Listening - Numbers",
    audioText: "Boy: How many books do you have in your bag? Girl: I have five books today.",
    questionText: "How many books does the girl have?",
    options: ["Three", "Five", "Seven"],
    correctAnswer: "Five"
  },
  {
    id: "L_P2_04",
    section: "listening",
    part: 2,
    taskNumber: 5,
    questionNumberInTask: 4,
    type: "listening-mcq",
    testingFocus: "Listening - Time",
    audioText: "Girl: When does the English class start, Tom? Boy: It starts at nine o'clock in the morning.",
    questionText: "What time does the English class start?",
    options: ["8:00 AM", "9:00 AM", "10:00 AM"],
    correctAnswer: "9:00 AM"
  },

  // ─── LISTENING: Part 3 - Longer Listening (listening-detail) ───
  // All questions in Part 3 share the same audioText
  {
    id: "L_P3_01",
    section: "listening",
    part: 3,
    taskNumber: 6,
    questionNumberInTask: 1,
    type: "listening-detail",
    testingFocus: "Listening Detail - Saturday Activity",
    audioText: "Hi! Let me tell you about my busy weekend. On Saturday morning, my family and I went to the beach. The weather was very hot and sunny, so my brother and I swam in the sea for two hours. On Sunday, we visited our grandmother at her countryside house. We ate a big lunch together, and then we watched an exciting movie. We had a great time!",
    questionText: "Where did the family go on Saturday morning?",
    options: ["To the beach", "To the park", "To the cinema"],
    correctAnswer: "To the beach"
  },
  {
    id: "L_P3_02",
    section: "listening",
    part: 3,
    taskNumber: 6,
    questionNumberInTask: 2,
    type: "listening-detail",
    testingFocus: "Listening Detail - Saturday Weather",
    audioText: "Hi! Let me tell you about my busy weekend. On Saturday morning, my family and I went to the beach. The weather was very hot and sunny, so my brother and I swam in the sea for two hours. On Sunday, we visited our grandmother at her countryside house. We ate a big lunch together, and then we watched an exciting movie. We had a great time!",
    questionText: "What was the weather like on Saturday?",
    options: ["Cold and rainy", "Hot and sunny", "Cloudy and windy"],
    correctAnswer: "Hot and sunny"
  },
  {
    id: "L_P3_03",
    section: "listening",
    part: 3,
    taskNumber: 6,
    questionNumberInTask: 3,
    type: "listening-detail",
    testingFocus: "Listening Detail - Sunday Activity",
    audioText: "Hi! Let me tell you about my busy weekend. On Saturday morning, my family and I went to the beach. The weather was very hot and sunny, so my brother and I swam in the sea for two hours. On Sunday, we visited our grandmother at her countryside house. We ate a big lunch together, and then we watched an exciting movie. We had a great time!",
    questionText: "Who did they visit on Sunday?",
    options: ["Their teacher", "Their friends", "Their grandmother"],
    correctAnswer: "Their grandmother"
  },
  {
    id: "L_P3_04",
    section: "listening",
    part: 3,
    taskNumber: 6,
    questionNumberInTask: 4,
    type: "listening-detail",
    testingFocus: "Listening Detail - Sunday Afternoon",
    audioText: "Hi! Let me tell you about my busy weekend. On Saturday morning, my family and I went to the beach. The weather was very hot and sunny, so my brother and I swam in the sea for two hours. On Sunday, we visited our grandmother at her countryside house. We ate a big lunch together, and then we watched an exciting movie. We had a great time!",
    questionText: "What did they do after lunch on Sunday?",
    options: ["They played football", "They watched a movie", "They went shopping"],
    correctAnswer: "They watched a movie"
  }
];

async function seed() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("🧹 Clearing old Cambridge placement test data...");
    await CambridgeQuestion.deleteMany({});
    await TestPaper.deleteMany({ moduleType: "yle" });

    console.log("🌱 Seeding 30 Cambridge Placement questions...");
    const createdQuestions = await CambridgeQuestion.insertMany(mockQuestions);
    console.log(`✅ Successfully seeded ${createdQuestions.length} questions.`);

    console.log("🌱 Creating default published YLE Test Paper...");
    const questionIds = createdQuestions.map(q => q.id);
    const testPaper = await TestPaper.create({
      id: "TEST_YLE_CAMBRIDGE",
      name: "Cambridge Placement Test YLE (Starters/Movers/Flyers)",
      moduleType: "yle",
      status: "published",
      questionIds: questionIds
    });
    console.log(`✅ Successfully created and published TestPaper: ${testPaper.name} (${testPaper.id})`);

    // Ensure AppConfig singleton exists and points to this fixed test or is in random mode
    let config = await AppConfig.findOne({ singletonId: "global_config" });
    if (!config) {
      config = await AppConfig.create({
        singletonId: "global_config",
        interactiveMode: "random",
        interactiveFixedTestId: "",
        yleMode: "random",
        yleFixedTestId: ""
      });
      console.log("✅ Created AppConfig.");
    }

  } catch (err) {
    console.error("❌ Error seeding Cambridge data:", err);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Database disconnected.");
    process.exit(0);
  }
}

seed();
