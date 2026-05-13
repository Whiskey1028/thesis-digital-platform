import { NextResponse } from "next/server";
import { repositories } from "@/lib/repositories";
import { writerSchema } from "@/lib/validation";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const writer = await repositories.writers.getById(id);

  if (!writer) {
    return NextResponse.json({ error: "Writer not found" }, { status: 404 });
  }

  return NextResponse.json({ data: writer });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const payload = await request.json();
  const parsed = writerSchema.partial().safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const updated = await repositories.writers.update(id, parsed.data);

  if (!updated) {
    return NextResponse.json({ error: "Writer not found" }, { status: 404 });
  }

  return NextResponse.json({ data: updated });
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const removed = await repositories.writers.remove(id);

  if (!removed) {
    return NextResponse.json({ error: "Writer not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
