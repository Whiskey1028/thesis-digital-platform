import { NextResponse } from "next/server";
import { repositories } from "@/lib/repositories";

export async function GET() {
  const orders = await repositories.orders.list();
  return NextResponse.json({ data: orders });
}

export async function POST() {
  return NextResponse.json(
    {
      error: "Orders must be created from a client profile."
    },
    { status: 405 }
  );
}
