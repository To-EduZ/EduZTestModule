import mongoose, { Schema, Document, Model } from "mongoose";

export interface IContextType extends Document {
  key: string; // Unique type key, e.g. "Scene_Description"
  name: string; // Display name, e.g. "Scene Description (Mô tả tranh bối cảnh)"
}

const ContextTypeSchema: Schema<IContextType> = new Schema(
  {
    key: { type: String, required: true, unique: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

const ContextType: Model<IContextType> =
  mongoose.models.ContextType ||
  mongoose.model<IContextType>("ContextType", ContextTypeSchema);

export default ContextType;
