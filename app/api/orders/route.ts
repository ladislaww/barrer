import { NextResponse } from "next/server";
import { createOrder, decrementProductStock, getProductStocks } from "@/lib/cms/orders";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    !Array.isArray(body.items) ||
    typeof body.customerEmail !== "string" ||
    typeof body.customerPhone !== "string" ||
    !body.customerPhone.trim()
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const items = body.items as Array<{ productId: string; quantity: number }>;
  const productIds = items.map((i) => i.productId);

  const stocks = await getProductStocks(productIds);
  if (Object.keys(stocks).length > 0) {
    for (const item of items) {
      const available = stocks[item.productId] ?? 0;
      if (available < item.quantity) {
        return NextResponse.json(
          { ok: false, error: "Insufficient stock", productId: item.productId },
          { status: 400 }
        );
      }
    }
  }

  const order = await createOrder({
    items,
    total: Number(body.total ?? 0),
    customerEmail: body.customerEmail,
    customerPhone: String(body.customerPhone).trim()
  });

  for (const item of items) {
    await decrementProductStock(item.productId, item.quantity);
  }

  return NextResponse.json({ ok: true, order });
}
