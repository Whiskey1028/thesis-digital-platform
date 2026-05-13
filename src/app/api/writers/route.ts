import { NextResponse } from "next/server";
import { repositories } from "@/lib/repositories";
import { writerSchema } from "@/lib/validation";
import type { Writer } from "@/lib/types";

function createWriterId() {
  return `wri_${Date.now()}`;
}

export async function GET() {
  const writers = await repositories.writers.list();
  return NextResponse.json({ data: writers });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = writerSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const writer: Writer = {
    id: createWriterId(),
    ...parsed.data
  };

  const created = await repositories.writers.create(writer);
  return NextResponse.json({ data: created }, { status: 201 });
}
