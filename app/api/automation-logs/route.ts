import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { AutomationLog } from "@/lib/models/AutomationLog";

export async function GET() {
  await connectDB();
  const logs = await AutomationLog.find().sort({ timestamp: -1 }).limit(200);
  return Response.json(logs);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await AutomationLog.create({
    timestamp: new Date().toISOString(),
    ...body,
  });
  return Response.json(created, { status: 201 });
}
