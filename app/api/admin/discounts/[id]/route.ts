import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDiscountById, updateDiscount, deleteDiscount } from "@/lib/db/discounts";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const discount = await getDiscountById(id);
  if (!discount) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ discount });
}

export async function PATCH(request: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const discount = await updateDiscount(id, {
    percentage: body.percentage !== undefined ? Number(body.percentage) : undefined,
    startsAt: body.startsAt ? new Date(body.startsAt) : undefined,
    endsAt: body.endsAt ? new Date(body.endsAt) : undefined,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
    productIds: Array.isArray(body.productIds) ? body.productIds : undefined
  });
  return NextResponse.json({ discount });
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await params;
  await deleteDiscount(id);
  return NextResponse.json({ ok: true });
}
