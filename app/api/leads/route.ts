import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Lead } from "@/lib/models/Lead";

export async function GET() {
  await connectDB();
  const leads = await Lead.find().sort({ createdAt: -1 });
  return Response.json(leads);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await Lead.create({
    createdAt: new Date().toISOString(),
    ...body,
  });
  return Response.json(created, { status: 201 });
}
