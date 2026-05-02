import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Membership } from "@/lib/models/Membership";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const ms = await Membership.findById(id);
  if (!ms) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(ms);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await Membership.findByIdAndUpdate(id, body, { new: true });
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const deleted = await Membership.findByIdAndDelete(id);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
