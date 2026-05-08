import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Admin } from "@/lib/models/Admin";
import { requireAuth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const payload = await requireAuth(req);
  await connectDB();
  const admin = await Admin.findById(payload.sub);
  if (!admin) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ id: String(admin._id), username: admin.username, name: admin.name });
}
