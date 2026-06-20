import mongoose, { Schema, Document, Model } from "mongoose";

export interface IAppConfig extends Document {
  // A singleton document with a fixed ID
  singletonId: string;
  
  interactiveMode: "fixed" | "random";
  interactiveFixedTestId: string; // ID of the TestPaper to show if mode is fixed
  
  yleMode: "fixed" | "random";
  yleFixedTestId: string;
}

const AppConfigSchema: Schema<IAppConfig> = new Schema(
  {
    singletonId: { type: String, default: "global_config", unique: true },
    interactiveMode: { type: String, enum: ["fixed", "random"], default: "random" },
    interactiveFixedTestId: { type: String, default: "" },
    
    yleMode: { type: String, enum: ["fixed", "random"], default: "random" },
    yleFixedTestId: { type: String, default: "" },
  },
  { timestamps: true }
);

const AppConfig: Model<IAppConfig> =
  mongoose.models.AppConfig ||
  mongoose.model<IAppConfig>("AppConfig", AppConfigSchema);

export default AppConfig;
