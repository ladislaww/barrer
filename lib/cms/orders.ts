import { sanityWriteClient } from "./client";
import type { Order, OrderItem } from "./types";

const orders: Order[] = [];

/** Fetch current stock for product IDs (Sanity only). */
export async function getProductStocks(
  productIds: string[]
): Promise<Record<string, number>> {
  if (!sanityWriteClient || productIds.length === 0) return {};
  const ids = [...new Set(productIds)];
  const list = await sanityWriteClient.fetch<{ _id: string; stock: number | null }[]>(
    `*[_type == "product" && _id in $ids]{ _id, "stock": coalesce(stock, 0) }`,
    { ids }
  );
  return Object.fromEntries(list.map((p) => [p._id, p.stock ?? 0]));
}

/** Decrement product stock in Sanity. */
export async function decrementProductStock(
  productId: string,
  quantity: number
): Promise<void> {
  if (!sanityWriteClient || quantity <= 0) return;
  await sanityWriteClient.patch(productId).dec({ stock: quantity }).commit();
}

export async function createOrder(order: Omit<Order, "id" | "status">): Promise<Order> {
  if (sanityWriteClient) {
    const created = await sanityWriteClient.create({
      _type: "order",
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      total: order.total,
      status: "created",
      items: order.items.map((item: OrderItem) => ({
        _type: "orderItem",
        product: { _type: "reference", _ref: item.productId },
        quantity: item.quantity
      })),
      createdAt: new Date().toISOString()
    });

    return {
      id: created._id,
      items: order.items,
      total: order.total,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      status: "created"
    };
  }

  const created: Order = {
    ...order,
    id: `ord_${Date.now()}`,
    status: "created"
  };
  orders.push(created);
  return created;
}

export async function listOrders(): Promise<Order[]> {
  if (sanityWriteClient) {
    const results = await sanityWriteClient.fetch<Order[]>(
      `*[_type == "order"] | order(createdAt desc) {
        "id": _id,
        customerEmail,
        customerPhone,
        total,
        status,
        "items": items[]{ "productId": product._ref, quantity }
      }`
    );
    return results;
  }

  return orders;
}

export async function updateOrderStatus(orderId: string, status: Order["status"]) {
  if (sanityWriteClient) {
    const updated = await sanityWriteClient
      .patch(orderId)
      .set({ status })
      .commit({ autoGenerateArrayKeys: true });
    return updated ? { ...updated, id: updated._id } : null;
  }

  const order = orders.find((item) => item.id === orderId);
  if (order) {
    order.status = status;
  }
  return order ?? null;
}
