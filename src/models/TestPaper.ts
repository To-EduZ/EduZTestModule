import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestPaper extends Document {
  id: string; // Unique test identifier (e.g., 'TEST_01')
  name: string; // "Đề thi Starters số 1"
  moduleType: "interactive";
  status: "draft" | "published";
  questionIds: string[]; // List of question IDs in this test
  createdAt: Date;
  updatedAt: Date;
}

const TestPaperSchema: Schema<ITestPaper> = new Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    moduleType: { type: String, enum: ["interactive"], required: true },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    questionIds: { type: [String], default: [] },
  },
  { timestamps: true }
);

TestPaperSchema.index({ id: 1 }, { unique: true });
TestPaperSchema.index({ moduleType: 1, status: 1 });

const TestPaper: Model<ITestPaper> =
  mongoose.models.TestPaper ||
  mongoose.model<ITestPaper>("TestPaper", TestPaperSchema);

export default TestPaper;
