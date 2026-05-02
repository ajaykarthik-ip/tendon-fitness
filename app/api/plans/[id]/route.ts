import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Plan } from "@/lib/models/Plan";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const plan = await Plan.findById(id);
  if (!plan) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(plan);
}

export async function PUT(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const body = await req.json();
  const updated = await Plan.findByIdAndUpdate(id, body, { new: true });
  if (!updated) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(updated);
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  await connectDB();
  const { id } = await ctx.params;
  const deleted = await Plan.findByIdAndDelete(id);
  if (!deleted) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ ok: true });
}
