import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Member } from "@/lib/models/Member";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const member = await Member.findById(id);
  if (!member) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(member);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await Member.findByIdAndUpdate(id, body, { new: true });
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const deleted = await Member.findByIdAndDelete(id);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
