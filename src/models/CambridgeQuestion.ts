import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICambridgeQuestion extends Document {
  id: string;
  section: "language-use" | "listening";
  part: number; // 1, 2, or 3
  taskNumber: number;
  questionNumberInTask: number;
  type: string; // "dialogue-mcq", "gapped-text", "listening-image", "listening-mcq", "listening-detail"
  testingFocus: string;
  
  // Optional specific fields depending on type
  dialogue?: string;
  passage?: string;
  gapLabel?: string;
  audioText?: string;
  
  questionText: string;
  options: string[];
  correctAnswer: string;
  images?: string[]; // Array of image paths for listening-image type
  
  createdAt: Date;
  updatedAt: Date;
}

const CambridgeQuestionSchema: Schema<ICambridgeQuestion> = new Schema(
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

// Indexes for fast querying
CambridgeQuestionSchema.index({ id: 1 }, { unique: true });
CambridgeQuestionSchema.index({ section: 1, part: 1 });
CambridgeQuestionSchema.index({ type: 1 });

const CambridgeQuestion: Model<ICambridgeQuestion> =
  mongoose.models.CambridgeQuestion ||
  mongoose.model<ICambridgeQuestion>("CambridgeQuestion", CambridgeQuestionSchema);

export default CambridgeQuestion;
