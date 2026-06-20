import mongoose from "mongoose";

const MascotSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    description: { type: String, default: "" },
    avatarUrl: { type: String, required: true },
    images: {
      idle: { type: String, default: "" },
      speaking: { type: String, default: "" },
      listening: { type: String, default: "" },
      thinking: { type: String, default: "" },
      happy: { type: String, default: "" },
      encouraging: { type: String, default: "" },
    },
    dialogue: {
      speaking: { type: String, default: "Đang nói..." },
      listening: { type: String, default: "Đang nghe..." },
      thinking: { type: String, default: "Đang suy nghĩ..." },
    },
    themeColors: {
      ring: { type: String, default: "border-blue-300 dark:border-blue-700" },
      bg: { type: String, default: "bg-sky-50 dark:bg-slate-800" },
      text: { type: String, default: "text-indigo-500 dark:text-indigo-400" },
      border: { type: String, default: "border-slate-100 dark:border-slate-800" },
    },
  },
  { timestamps: true }
);

const Mascot = mongoose.models.Mascot || mongoose.model("Mascot", MascotSchema);

export default Mascot;
