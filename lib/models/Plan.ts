import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const PlanSchema = new Schema(
  {
    name: { type: String, required: true },
    price: { type: Number, required: true },
    durationMonths: { type: Number, required: true, min: 1 },
    description: { type: String, default: "" },
  },
  { timestamps: true, toJSON: { transform }, toObject: { transform } }
);

export const Plan = models.Plan || model("Plan", PlanSchema);
