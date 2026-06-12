import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAssessmentResult extends Document {
  userId: string;
  adaptiveSessionId?: string; // Link to AdaptiveSession if from CAT
  level: "Starters" | "Movers" | "Flyers";
  skill: "Speaking" | "Listening" | "Reading" | "Writing";
  sentence: string;
  spokenText: string;
  recordedAudioUrl: string;
  targetAnswer?: string;
  userAnswer?: string;
  corrections?: string;
  score: number;
  stars: number;
  mispronouncedWords: string[];
  feedback: {
    tutorComment: string;
    tips: string;
  };
  roadmap: string[];
  createdAt: Date;
}

const AssessmentResultSchema: Schema<IAssessmentResult> = new Schema(
  {
    userId: { type: String, required: true },
    adaptiveSessionId: { type: String },
    level: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
      required: true,
    },
    skill: {
      type: String,
      enum: ["Speaking", "Listening", "Reading", "Writing"],
      default: "Speaking",
      required: true,
    },
    sentence: { type: String, required: true },
    spokenText: { type: String, default: "" },
    recordedAudioUrl: { type: String, default: "" },
    targetAnswer: { type: String, default: "" },
    userAnswer: { type: String, default: "" },
    corrections: { type: String, default: "" },
    score: { type: Number, required: true, min: 0, max: 100 },
    stars: { type: Number, required: true, min: 1, max: 5 },
    mispronouncedWords: { type: [String], default: [] },
    feedback: {
      tutorComment: { type: String, required: true },
      tips: { type: String, default: "" },
    },
    roadmap: { type: [String], default: [] },
  },
  { timestamps: true }
);

const AssessmentResult: Model<IAssessmentResult> =
  mongoose.models.AssessmentResult ||
  mongoose.model<IAssessmentResult>("AssessmentResult", AssessmentResultSchema);

export default AssessmentResult;
