import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Membership } from "@/lib/models/Membership";

export async function GET(req: NextRequest) {
  await connectDB();
  const memberId = req.nextUrl.searchParams.get("memberId");
  const filter = memberId ? { memberId } : {};
  const memberships = await Membership.find(filter).sort({ endDate: -1 });
  return Response.json(memberships);
}

export async function POST(req: NextRequest) {
  await connectDB();
  const body = await req.json();
  const created = await Membership.create(body);
  return Response.json(created, { status: 201 });
}
