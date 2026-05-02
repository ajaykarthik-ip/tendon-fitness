import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  ret.memberId = String(ret.memberId);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const AlertSchema = new Schema(
  {
    type: { type: String, enum: ["expiring", "expired", "payment"], required: true },
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    createdAt: { type: String, required: true },
  },
  { toJSON: { transform }, toObject: { transform } }
);

export const Alert = models.Alert || model("Alert", AlertSchema);
