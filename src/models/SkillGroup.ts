import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISkillGroup extends Document {
  code: string; // Unique group code, e.g. "1.1"
  name: string; // Skill name, e.g. "Vocabulary & Pronunciation"
  description?: string; // Optional description
  createdAt: Date;
  updatedAt: Date;
}

const SkillGroupSchema: Schema<ISkillGroup> = new Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

const SkillGroup: Model<ISkillGroup> =
  mongoose.models.SkillGroup ||
  mongoose.model<ISkillGroup>("SkillGroup", SkillGroupSchema);

export default SkillGroup;
