import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Alert } from "@/lib/models/Alert";

export async function GET() {
  await connectDB();
  const alerts = await Alert.find().sort({ createdAt: -1 });
  return Response.json(alerts);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await Alert.create({
    createdAt: new Date().toISOString(),
    ...body,
  });
  return Response.json(created, { status: 201 });
}
