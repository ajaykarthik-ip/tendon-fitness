import { Schema, model, models } from "mongoose";

const transform = (_doc: unknown, ret: Record<string, unknown>) => {
  ret.id = String(ret._id);
  delete ret._id;
  delete ret.__v;
  delete ret.passwordHash;
  return ret;
};

const AdminSchema = new Schema(
  {
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, default: "" },
    passwordHash: { type: String, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { toJSON: { transform }, toObject: { transform } }
);

export const Admin = models.Admin || model("Admin", AdminSchema);
