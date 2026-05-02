import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const LeadSchema = new Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    source: { type: String, default: "" },
    createdAt: { type: String, required: true },
  },
  { toJSON: { transform }, toObject: { transform } }
);

export const Lead = models.Lead || model("Lead", LeadSchema);
