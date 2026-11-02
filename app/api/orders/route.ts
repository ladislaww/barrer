import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getAvailableProducts } from "@/lib/db/products";
import { createOrder } from "@/lib/db/orders";
import { notifyAdminAboutOrder } from "@/lib/telegram";
import { getActiveDiscountsForUser } from "@/lib/db/discounts";
import { priceOrderItems } from "@/lib/orders/pricing";
import { normalizeOrderItems } from "@/lib/orders/items";
import { USD_RATE_RUB } from "@/lib/i18n";
import type { Currency } from "@/lib/db/types";

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.customerEmail !== "string" ||
    typeof body.customerPhone !== "string" ||
    !body.customerPhone.trim()
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  // Количество приходит из браузера, поэтому проверяется до любых расчётов.
  const normalized = normalizeOrderItems(body.items);
  if (!normalized.ok) {
    return NextResponse.json({ ok: false, error: normalized.error }, { status: 400 });
  }

  const items = normalized.items;
  const productIds = items.map((i) => i.productId);

  const products = await getAvailableProducts(productIds);
  for (const item of items) {
    const product = products[item.productId];
    if (!product) {
      return NextResponse.json(
        { ok: false, error: "Product unavailable", productId: item.productId },
        { status: 400 }
      );
    }
    if (product.stock < item.quantity) {
      return NextResponse.json(
        { ok: false, error: "Insufficient stock", productId: item.productId },
        { status: 400 }
      );
    }
  }

  // Server-side discount verification
  const discounts = session?.user?.id
    ? await getActiveDiscountsForUser(session.user.id)
    : [];

  const priced = priceOrderItems(items, (productId) => products[productId].price, discounts);
  const { items: orderItems, subtotalRub, totalRub, discountRub, discountPct } = priced;

  const currency: Currency = body.currency === "USD" ? "USD" : "RUB";
  const exchangeRate = currency === "USD" ? USD_RATE_RUB : 1;
  const displayTotal = currency === "USD" ? totalRub / exchangeRate : totalRub;

  let order;
  try {
    order = await createOrder({
      userId: session?.user?.id,
      customerEmail: body.customerEmail,
      customerPhone: String(body.customerPhone).trim(),
      customerName: body.customerName ? String(body.customerName) : undefined,
      city: body.city ? String(body.city) : undefined,
      street: body.street ? String(body.street) : undefined,
      house: body.house ? String(body.house) : undefined,
      building: body.building ? String(body.building) : undefined,
      postal: body.postal ? String(body.postal) : undefined,
      comment: body.comment ? String(body.comment) : undefined,
      total: totalRub,
      totalRub,
      subtotalRub,
      discountRub,
      currency,
      exchangeRate,
      displayTotal,
      discountPct,
      items: orderItems
    });
  } catch {
    return NextResponse.json({ ok: false, error: "Insufficient stock" }, { status: 400 });
  }

  await notifyAdminAboutOrder(order);

  return NextResponse.json({ ok: true, order });
}
