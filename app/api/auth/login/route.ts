import { NextRequest } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/lib/models/Admin";
import { verifyPassword, signToken, TOKEN_COOKIE_OPTIONS } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const { username, password } = await req.json().catch(() => ({}));
  if (!username || !password) {
    return Response.json({ error: "Username and password required" }, { status: 400 });
  }

  await connectDB();
  const admin = await Admin.findOne({ username: String(username).toLowerCase().trim() });
  if (!admin) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const ok = await verifyPassword(String(password), admin.passwordHash);
  if (!ok) return Response.json({ error: "Invalid credentials" }, { status: 401 });

  const token = await signToken({ sub: String(admin._id), u: admin.username });
  const cookieStore = await cookies();
  cookieStore.set({ ...TOKEN_COOKIE_OPTIONS, value: token });

  return Response.json({
    token,
    admin: { id: String(admin._id), username: admin.username, name: admin.name },
  });
}
