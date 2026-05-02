import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Member } from "@/lib/models/Member";

export async function GET() {
  await connectDB();
  const members = await Member.find().sort({ createdAt: -1 });
  return Response.json(members);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await Member.create(body);
  return Response.json(created, { status: 201 });
}
