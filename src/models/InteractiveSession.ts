import mongoose, { Schema, Document, Model } from "mongoose";

export interface IInteractiveSession extends Document {
  userId: string;
  testCode?: string; // Code entered for this session
  testPaperId?: string; // Linked test paper ID if any
  kidName: string;
  kidAge: number;
  testKidName?: string;
  testKidAge?: number;
  scores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  chatHistory: {
    role: "ai" | "user";
    content: string;
    stage: string;
    timestamp?: Date;
  }[];
  studentStars: number | null; // Null means "no rating"
  overallLevel: string;
  testedSkills?: string[]; // [MỚI] kỹ năng đã kiểm tra thực tế
  sectionScores?: { // [MỚI] điểm số chi tiết từng phần
    sectionType: string;
    score: number;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const InteractiveSessionSchema: Schema<IInteractiveSession> = new Schema(
  {
    userId: { type: String, required: true },
    testCode: { type: String, default: "" },
    testPaperId: { type: String, default: "" },
    kidName: { type: String, required: true },
    kidAge: { type: Number, required: true },
    testKidName: { type: String, required: false },
    testKidAge: { type: Number, required: false },
    scores: {
      speaking: { type: Number, required: true },
      listening: { type: Number, required: true },
      reading: { type: Number, required: true },
      writing: { type: Number, required: true },
    },
    chatHistory: {
      type: [
        {
          role: { type: String, enum: ["ai", "user"] },
          content: { type: String },
          stage: { type: String },
          timestamp: { type: Date, default: Date.now }
        }
      ],
      default: [],
    },
    studentStars: { type: Number, default: null, min: 1, max: 5 },
    overallLevel: { type: String, required: true },
    testedSkills: { type: [String], default: [] },
    sectionScores: {
      type: [
        {
          sectionType: { type: String },
          score: { type: Number }
        }
      ],
      default: []
    }
  },
  { timestamps: true }
);

InteractiveSessionSchema.index({ testCode: 1 });
InteractiveSessionSchema.index({ userId: 1 });

const InteractiveSession: Model<IInteractiveSession> =
  mongoose.models.InteractiveSession ||
  mongoose.model<IInteractiveSession>("InteractiveSession", InteractiveSessionSchema);

export default InteractiveSession;

