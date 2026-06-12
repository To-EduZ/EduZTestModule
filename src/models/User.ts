import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  name: string;
  age: number;
  currentLevel: "Starters" | "Movers" | "Flyers";
  estimatedLevel?: "Starters" | "Movers" | "Flyers";
  totalStars: number;
  parentContact?: {
    parentName: string;
    phone?: string;
    email?: string;
  };
  className?: string;
  schoolName?: string;
  catHistory?: string[]; // Array of AdaptiveSession IDs
  createdAt: Date;
}

const UserSchema: Schema<IUser> = new Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 4, max: 14 },
    currentLevel: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
      default: "Starters",
    },
    estimatedLevel: {
      type: String,
      enum: ["Starters", "Movers", "Flyers"],
    },
    totalStars: { type: Number, default: 0 },
    parentContact: {
      parentName: { type: String },
      phone: { type: String },
      email: { type: String },
    },
    className: { type: String },
    schoolName: { type: String },
    catHistory: { type: [String], default: [] },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times in Next.js HMR environment
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
