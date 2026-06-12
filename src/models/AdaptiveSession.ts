import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAdaptiveSession extends Document {
  userId: string;
  sessionId: string; // UUID
  startedAt: Date;
  completedAt?: Date;
  status: "in_progress" | "completed" | "abandoned";
  
  // Adaptive state
  currentTheta: number; // IRT ability estimate (-3 to +3)
  currentLevel: "Starters" | "Movers" | "Flyers";
  questionSequence: {
    questionId: string;
    skill: "Speaking" | "Listening" | "Reading" | "Writing";
    level: "Starters" | "Movers" | "Flyers";
    response: string;
    isCorrect: boolean;
    score: number; // 0-100 per question
    timeTakenMs: number;
    irtDifficulty: number;
  }[];
  
  // Conversation log
  conversationLog: {
    role: "system" | "ai_tutor" | "student";
    content: string;
    timestamp: Date;
  }[];
  
  // Final scores (computed after completion)
  finalScores?: {
    vocabulary: number;
    grammar: number;
    pronunciation: number;
    fluency: number;
    overall: number;
  };
  
  // Final classification
  finalLevel?: "Starters" | "Movers" | "Flyers";
  
  // AI recommendation
  aiRecommendation?: string;
}

const AdaptiveSessionSchema: Schema<IAdaptiveSession> = new Schema(
  {
    userId: { type: String, required: true },
    sessionId: { type: String, required: true, unique: true },
    startedAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    status: {
      type: String,
      enum: ["in_progress", "completed", "abandoned"],
      default: "in_progress",
    },
    currentTheta: { type: Number, default: 0 },
    currentLevel: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
      default: "Movers",
    },
    questionSequence: [
      {
        questionId: { type: String, required: true },
        skill: { type: String, enum: ["Speaking", "Listening", "Reading", "Writing"], required: true },
        level: { type: String, enum: ["Starters", "Movers", "Flyers"], required: true },
        response: { type: String, required: true },
        isCorrect: { type: Boolean, required: true },
        score: { type: Number, required: true },
        timeTakenMs: { type: Number, required: true },
        irtDifficulty: { type: Number, required: true },
      },
    ],
    conversationLog: [
      {
        role: { type: String, enum: ["system", "ai_tutor", "student"], required: true },
        content: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    finalScores: {
      vocabulary: { type: Number },
      grammar: { type: Number },
      pronunciation: { type: Number },
      fluency: { type: Number },
      overall: { type: Number },
    },
    finalLevel: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
    },
    aiRecommendation: { type: String },
  },
  { timestamps: true }
);

const AdaptiveSession: Model<IAdaptiveSession> =
  mongoose.models.AdaptiveSession ||
  mongoose.model<IAdaptiveSession>("AdaptiveSession", AdaptiveSessionSchema);

export default AdaptiveSession;
