const mongoose = require("mongoose");

const mongodbUri = "mongodb+srv://EduZ3667:naobo2@englishkidsapp.hyzcoyq.mongodb.net/english-kids-app?appName=EnglishKidsApp";

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

const Question = mongoose.models.Question || mongoose.model("Question", QuestionSchema);

const restoredQuestions = [
  {
    id: "ST_P1_47",
    level: "Starters",
    part: 1,
    type: "Scene_Description",
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/pg_1/v1779971869/hubxanh_yle_pdf_digitalizer/ST_P1_47_1779971867318.png",
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
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/pg_1/v1779972041/hubxanh_yle_pdf_digitalizer/MV_P2_47_1779972038367.png",
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
    imagePath: "https://res.cloudinary.com/dupquwf3j/image/upload/pg_1/v1779976441/hubxanh_yle_pdf_digitalizer/MV_P3_47_1779976438703.png",
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

async function run() {
  try {
    await mongoose.connect(mongodbUri);
    console.log("Connected to MongoDB.");
    
    await Question.deleteMany({});
    console.log("Cleared mock questions.");
    
    await Question.insertMany(restoredQuestions);
    console.log("Restored original questions from Cloudinary data!");
    
  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

run();
