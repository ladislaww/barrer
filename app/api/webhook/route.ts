import { NextResponse } from "next/server";
import { updateOrderStatus } from "@/lib/cms/orders";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body.orderId !== "string" || typeof body.status !== "string") {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const updated = await updateOrderStatus(body.orderId, body.status);
  return NextResponse.json({ ok: Boolean(updated) });
}
