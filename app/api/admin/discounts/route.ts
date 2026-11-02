import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listDiscounts, createDiscount } from "@/lib/db/discounts";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const discounts = await listDiscounts();
  return NextResponse.json({ discounts });
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (
    !body ||
    typeof body.percentage !== "number" ||
    body.percentage <= 0 ||
    body.percentage > 100 ||
    !body.startsAt ||
    !body.endsAt ||
    !Array.isArray(body.productIds)
  ) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const discount = await createDiscount({
    percentage: body.percentage,
    startsAt: new Date(body.startsAt),
    endsAt: new Date(body.endsAt),
    isActive: body.isActive !== false,
    productIds: body.productIds as string[]
  });
  return NextResponse.json({ discount }, { status: 201 });
}
