import { NextResponse } from "next/server";
import { repositories } from "@/lib/repositories";
import { clientSchema } from "@/lib/validation";
import type { Client } from "@/lib/types";

function createClientId() {
  return `cli_${Date.now()}`;
}

export async function GET() {
  const clients = await repositories.clients.list();
  return NextResponse.json({ data: clients });
}

export async function POST(request: Request) {
  const payload = await request.json();
  const parsed = clientSchema.safeParse(payload);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const client: Client = {
    id: createClientId(),
    ...parsed.data,
    lastContactAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  const created = await repositories.clients.create(client);
  return NextResponse.json({ data: created }, { status: 201 });
}
