import { prisma } from "./prisma";
import type { Currency, Order, OrderStatus, OrderWithItems, Product } from "./types";
import { INITIAL_ORDER_STATUS, REVENUE_ORDER_STATUSES, isOrderStatus } from "@/lib/orders/status";
import type {
  Order as DbOrder,
  OrderItem as DbOrderItem,
  Product as DbProduct
} from "@prisma/client";

type DbOrderWithItems = DbOrder & {
  items: (DbOrderItem & { product: DbProduct })[];
};

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function normalizeProduct(raw: DbProduct): Product {
  return {
    ...raw,
    details: parseList(raw.details),
    detailsEn: parseList(raw.detailsEn),
    images: parseList(raw.images)
  };
}

function normalizeOrder(raw: DbOrder): Order {
  return {
    ...raw,
    // Неизвестный статус из старых данных трактуем как оплаченный заказ.
    status: isOrderStatus(raw.status) ? raw.status : INITIAL_ORDER_STATUS,
    currency: raw.currency === "USD" ? "USD" : "RUB",
    discountPct: raw.discountPct ?? 0
  };
}

function normalizeOrderWithItems(raw: DbOrderWithItems): OrderWithItems {
  return {
    ...normalizeOrder(raw),
    items: raw.items.map((item) => ({
      ...item,
      product: normalizeProduct(item.product)
    }))
  };
}

export type CreateOrderItemInput = {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitPriceDiscounted: number;
  lineTotal: number;
  lineTotalDiscounted: number;
};

type CreateOrderInput = {
  userId?: string;
  customerEmail: string;
  customerPhone: string;
  customerName?: string;
  city?: string;
  street?: string;
  house?: string;
  building?: string;
  postal?: string;
  comment?: string;
  total: number;
  totalRub: number;
  subtotalRub: number;
  discountRub: number;
  currency: Currency;
  exchangeRate: number;
  displayTotal: number;
  discountPct?: number;
  items: CreateOrderItemInput[];
};

export async function createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
  const row = await prisma.$transaction(async (tx) => {
    for (const item of input.items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
        select: { stock: true, inStock: true, isVisible: true }
      });
      if (!product || !product.isVisible || !product.inStock || product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    const order = await tx.order.create({
      data: {
        userId: input.userId,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        customerName: input.customerName,
        city: input.city,
        street: input.street,
        house: input.house,
        building: input.building,
        postal: input.postal,
        comment: input.comment,
        total: input.total,
        totalRub: input.totalRub,
        subtotalRub: input.subtotalRub,
        discountRub: input.discountRub,
        currency: input.currency,
        exchangeRate: input.exchangeRate,
        displayTotal: input.displayTotal,
        discountPct: input.discountPct ?? 0,
        status: INITIAL_ORDER_STATUS,
        items: {
          create: input.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitPriceDiscounted: item.unitPriceDiscounted,
            lineTotal: item.lineTotal,
            lineTotalDiscounted: item.lineTotalDiscounted
          }))
        }
      },
      include: { items: { include: { product: true } } }
    });

    for (const item of input.items) {
      const updated = await tx.product.update({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
        select: { stock: true }
      });
      if (updated.stock <= 0) {
        await tx.product.update({
          where: { id: item.productId },
          data: { inStock: false, stock: 0 }
        });
      }
    }

    return order;
  });
  return normalizeOrderWithItems(row);
}

export const ORDER_SORT_KEYS = ["createdAt", "status", "totalRub", "customerEmail"] as const;
export type OrderSortKey = (typeof ORDER_SORT_KEYS)[number];

export type OrderQuery = {
  status: OrderStatus | "ALL";
  sort: OrderSortKey;
  dir: "asc" | "desc";
};

/** Логический порядок статусов для сортировки: сначала ожидающие доставки. */
const STATUS_ORDER: Record<OrderStatus, number> = { PAID: 0, DELIVERED: 1, RETURNED: 2 };

export function parseOrderQuery(params: URLSearchParams): OrderQuery {
  const rawStatus = params.get("status");
  const rawSort = params.get("sort");

  return {
    status: isOrderStatus(rawStatus) ? rawStatus : "ALL",
    sort: ORDER_SORT_KEYS.includes(rawSort as OrderSortKey) ? (rawSort as OrderSortKey) : "createdAt",
    dir: params.get("dir") === "asc" ? "asc" : "desc"
  };
}

function orderTotal(order: Order): number {
  return order.totalRub || order.total;
}

export async function listOrders(query?: Partial<OrderQuery>): Promise<OrderWithItems[]> {
  const status = query?.status ?? "ALL";
  const sort = query?.sort ?? "createdAt";
  const dir = query?.dir ?? "desc";

  const rows = await prisma.order.findMany({
    where: status === "ALL" ? undefined : { status },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } }
  });

  const orders = rows.map(normalizeOrderWithItems);
  const sign = dir === "asc" ? 1 : -1;

  // Сортировка в памяти: статусы упорядочены логически, а не по алфавиту.
  return orders.sort((a, b) => {
    switch (sort) {
      case "status":
        return sign * (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
      case "totalRub":
        return sign * (orderTotal(a) - orderTotal(b));
      case "customerEmail":
        return sign * a.customerEmail.localeCompare(b.customerEmail, "ru");
      default:
        return sign * (a.createdAt.getTime() - b.createdAt.getTime());
    }
  });
}

/** Количество заказов в каждом статусе — для счётчиков рядом с фильтром. */
export async function countOrdersByStatus(): Promise<Record<OrderStatus | "ALL", number>> {
  const grouped = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });

  const counts: Record<OrderStatus | "ALL", number> = {
    ALL: 0,
    PAID: 0,
    DELIVERED: 0,
    RETURNED: 0
  };
  for (const row of grouped) {
    const status = isOrderStatus(row.status) ? row.status : INITIAL_ORDER_STATUS;
    counts[status] += row._count._all;
    counts.ALL += row._count._all;
  }
  return counts;
}

export async function getOrderById(id: string): Promise<OrderWithItems | null> {
  const row = await prisma.order.findUnique({
    where: { id },
    include: { items: { include: { product: true } } }
  });
  return row ? normalizeOrderWithItems(row) : null;
}

/** Заказ конкретного покупателя — чтобы из кабинета нельзя было открыть чужой заказ. */
export async function getUserOrderById(userId: string, orderId: string): Promise<OrderWithItems | null> {
  const row = await prisma.order.findFirst({
    where: { id: orderId, userId },
    include: { items: { include: { product: true } } }
  });
  return row ? normalizeOrderWithItems(row) : null;
}

export async function listOrdersByUser(userId: string): Promise<OrderWithItems[]> {
  const rows = await prisma.order.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } }
  });
  return rows.map(normalizeOrderWithItems);
}

/**
 * Меняет статус заказа и синхронно правит остатки.
 *
 * Перевод в «Возврат» возвращает товар на склад, обратный перевод — снова
 * списывает. Без этого возвращённая вещь исчезала со склада навсегда.
 * Движение остатков происходит только при пересечении границы RETURNED,
 * поэтому повторное сохранение того же статуса ничего не меняет.
 */
export async function updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order | null> {
  try {
    const row = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: { select: { productId: true, quantity: true } } }
      });
      if (!current) throw new Error(`Order ${orderId} not found`);

      const wasReturned = current.status === "RETURNED";
      const willBeReturned = status === "RETURNED";

      if (wasReturned !== willBeReturned) {
        for (const item of current.items) {
          if (willBeReturned) {
            // Возврат: товар снова доступен к продаже.
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity }, inStock: true }
            });
            continue;
          }

          // Возврат отменили — списываем товар обратно, не уходя в минус.
          const product = await tx.product.findUnique({
            where: { id: item.productId },
            select: { stock: true }
          });
          if (!product) continue;

          const nextStock = Math.max(0, product.stock - item.quantity);
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: nextStock, inStock: nextStock > 0 }
          });
        }
      }

      return tx.order.update({ where: { id: orderId }, data: { status } });
    });

    return normalizeOrder(row);
  } catch {
    return null;
  }
}

export async function getOrderStats() {
  const [totalOrders, revenueOrders, awaitingDelivery, returned, totalProducts] = await Promise.all([
    prisma.order.count(),
    prisma.order.findMany({
      where: { status: { in: REVENUE_ORDER_STATUSES } },
      select: { total: true, totalRub: true }
    }),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "RETURNED" } }),
    prisma.product.count()
  ]);
  return {
    totalOrders,
    revenue: revenueOrders.reduce((sum, o) => sum + (o.totalRub || o.total), 0),
    awaitingDelivery,
    returnedOrders: returned,
    totalProducts
  };
}
