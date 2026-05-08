import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const MemberSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, default: "" },
    phone: { type: String, required: true },
    photo: { type: String, default: "" },
    membershipId: { type: String, required: true, unique: true },
    lastVisit: { type: String, default: "" },
    attendance: { type: Number, default: 0 },
    streak: { type: Number, default: 0 },
    createdAt: { type: String, default: () => new Date().toISOString().split("T")[0] },
  },
  { toJSON: { transform }, toObject: { transform } }
);

MemberSchema.index({ createdAt: -1 });
MemberSchema.index({ name: 1 });
MemberSchema.index({ phone: 1 });

export const Member = models.Member || model("Member", MemberSchema);
