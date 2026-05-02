import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";

export async function GET() {
  await connectDB();
  const plans = await Plan.find().sort({ price: 1 });
  return Response.json(plans);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await Plan.create(body);
  return Response.json(created, { status: 201 });
}
