import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestSection {
  type: "warmup" | "picture" | "reading" | "writing" | "custom_speaking";
  name: string;
  timeLimit?: number;
  questionIds: string[];
  config?: {
    picCount?: number;
    wordCount?: number;
    aiPromptOverride?: string;
  };
}

export interface ITestPaper extends Document {
  id: string; // Unique test identifier (e.g., 'TEST_01')
  name: string; // "Đề thi Starters số 1"
  moduleType: "interactive" | "yle";
  status: "draft" | "published";
  testCode?: string; // Unique test code for students to enter
  centerId?: string; // ID of the center that owns this test
  questionIds: string[]; // Keep for backward compatibility/flat structure if needed
  sections: ITestSection[]; // Modular sections structure
  createdAt: Date;
  updatedAt: Date;
}

const TestSectionSchema = new Schema({
  type: { 
    type: String, 
    enum: ["warmup", "picture", "reading", "writing", "custom_speaking"], 
    required: true 
  },
  name: { type: String, required: true },
  timeLimit: { type: Number },
  questionIds: { type: [String], default: [] },
  config: {
    picCount: { type: Number },
    wordCount: { type: Number },
    aiPromptOverride: { type: String }
  }
}, { _id: false });

const TestPaperSchema: Schema<ITestPaper> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    moduleType: { type: String, enum: ["interactive", "yle"], required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    testCode: { type: String, sparse: true }, // sparse allows multiple nulls but enforces uniqueness for non-nulls
    centerId: { type: String },
    questionIds: { type: [String], default: [] }, // Keep for backward compatibility
    sections: { type: [TestSectionSchema], default: [] },
  },
  { timestamps: true }
);

TestPaperSchema.index({ id: 1 }, { unique: true });
TestPaperSchema.index({ testCode: 1 }, { unique: true, sparse: true });
TestPaperSchema.index({ centerId: 1 });
TestPaperSchema.index({ moduleType: 1, status: 1 });

const TestPaper: Model<ITestPaper> =
  mongoose.models.TestPaper ||
  mongoose.model<ITestPaper>("TestPaper", TestPaperSchema);

export default TestPaper;

