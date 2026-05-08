import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/lib/models/Admin";
import {
  requireAuth,
  verifyPassword,
  hashPassword,
  signToken,
  TOKEN_COOKIE_OPTIONS,
} from "@/lib/auth";

export async function POST(req: NextRequest) {
  const payload = await requireAuth(req);
  const { currentPassword, newPassword } = await req.json().catch(() => ({}));
  if (!currentPassword || !newPassword) {
    return Response.json({ error: "Both passwords required" }, { status: 400 });
  }
  if (String(newPassword).length < 8) {
    return Response.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  await connectDB();
  const admin = await Admin.findById(payload.sub);
  if (!admin) return Response.json({ error: "Not found" }, { status: 404 });

  const ok = await verifyPassword(String(currentPassword), admin.passwordHash);
  if (!ok) return Response.json({ error: "Current password is incorrect" }, { status: 401 });

  admin.passwordHash = await hashPassword(String(newPassword));
  await admin.save();

  const token = await signToken({ sub: String(admin._id), u: admin.username });
  const cookieStore = await cookies();
  cookieStore.set({ ...TOKEN_COOKIE_OPTIONS, value: token });

  return Response.json({ ok: true, token });
}
