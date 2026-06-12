import mongoose, { Schema, Document, Model } from "mongoose";

export interface IQuestion extends Document {
  id: string; // Unique question identifier (e.g., 'ST_P1_03')
  level: "Starters" | "Movers" | "Flyers";
  part: number;
  type: string; // e.g. "Scene_Description", "Object_Card", "Storytelling"
  imagePath: string; // Cloudinary secure URL
  contextTags: string[];
  topic: string; // Added for Topic Tagging
  difficulty: "Easy" | "Medium" | "Hard"; // Added for Difficulty assessment
  examinerScript?: string; // Optional for backward compatibility
  evaluationCriteria?: {
    expectedKeywords: string[];
    targetGrammar: string[];
  }; // Optional for backward compatibility
  questions: {
    examinerScript: string;
    expectedKeywords: string[];
    targetGrammar: string[];
    topic?: string; // Added at sub-question level
    level?: "Starters" | "Movers" | "Flyers"; // Added at sub-question level
    difficulty?: "Easy" | "Medium" | "Hard"; // Added at sub-question level
    groupCode?: string; // Added for question categorization
    groupName?: string; // Added for question categorization
  }[]; // Added for One Context - Multiple Questions
  createdAt: Date;
  updatedAt: Date;
}

const QuestionSchema: Schema<IQuestion> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    level: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
      required: true,
    },
    part: { type: Number, required: true },
    type: { type: String, required: true },
    imagePath: { type: String, required: true },
    contextTags: { type: [String], default: [] },
    topic: { type: String, default: "General" },
    difficulty: {
      type: String,
      enum: ["Easy", "Medium", "Hard"],
      default: "Medium",
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
          groupCode: { type: String, default: "" },
          groupName: { type: String, default: "" },
        },
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Bổ sung chỉ mục (Indexes) phục vụ Scale & Tối ưu hóa truy vấn
QuestionSchema.index({ id: 1 }, { unique: true });
QuestionSchema.index({ level: 1, part: 1 });
QuestionSchema.index({ topic: 1 });
QuestionSchema.index({ difficulty: 1 });

const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;

