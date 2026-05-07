import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const AutomationLogSchema = new Schema(
  {
    type: { type: String, enum: ["whatsapp", "email", "batch", "system"], required: true },
    title: { type: String, required: true },
    subtitle: { type: String, default: "" },
    tag: { type: String },
    timestamp: { type: String, required: true },
  },
  { toJSON: { transform }, toObject: { transform } }
);

AutomationLogSchema.index({ timestamp: -1 });

export const AutomationLog =
  models.AutomationLog || model("AutomationLog", AutomationLogSchema);
