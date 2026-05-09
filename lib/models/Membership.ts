import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  ret.memberId = String(ret.memberId);
  ret.planId = String(ret.planId);
  delete ret._id;
  delete ret.__v;
  return ret;
};

const MembershipSchema = new Schema(
  {
    memberId: { type: Schema.Types.ObjectId, ref: "Member", required: true },
    planId: { type: Schema.Types.ObjectId, ref: "Plan", required: true },
    startDate: { type: String, required: true },
    endDate: { type: String, required: true },
    pendingAmount: { type: Number, default: 0 },
    bonusMonths: { type: Number, default: 0 },
  },
  { timestamps: true, toJSON: { transform }, toObject: { transform } }
);

MembershipSchema.index({ memberId: 1, endDate: -1 });
MembershipSchema.index({ endDate: -1 });
MembershipSchema.index({ planId: 1 });

export const Membership = models.Membership || model("Membership", MembershipSchema);
