import { prisma } from "./prisma";
import { makeBuyerKeyResolver } from "./buyer";
import { eachDay, toDateInput } from "@/lib/analytics/period";
import { REVENUE_ORDER_STATUSES } from "@/lib/orders/status";

/**
 * В выручке, среднем чеке и количестве заказов учитываются оплаченные и доставленные
 * заказы: доставленный заказ был оплачен, поэтому остаётся в выручке. RETURNED исключается.
 */
export const REVENUE_STATUS_FILTER = { in: REVENUE_ORDER_STATUSES };

export type DailyPoint = {
  date: string;
  revenue: number;
  orders: number;
  newBuyers: number;
  returningBuyers: number;
};

export type TopProduct = {
  productId: string;
  title: string;
  quantity: number;
  revenue: number;
};

export type AnalyticsResult = {
  revenue: number;
  paidOrders: number;
  averageCheck: number;
  uniqueBuyers: number;
  newBuyers: number;
  returningBuyers: number;
  daily: DailyPoint[];
  topProducts: TopProduct[];
};

/** totalRub — сумма в рублях; на старых заказах может быть 0, тогда берём total. */
function orderRevenue(order: { total: number; totalRub: number }): number {
  return order.totalRub || order.total;
}

export async function getAnalytics(from: Date, to: Date): Promise<AnalyticsResult> {
  const [users, ordersInPeriod, ordersBefore] = await Promise.all([
    prisma.user.findMany({ select: { id: true, email: true } }),
    prisma.order.findMany({
      where: { status: REVENUE_STATUS_FILTER, createdAt: { gte: from, lte: to } },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        customerEmail: true,
        total: true,
        totalRub: true,
        createdAt: true,
        items: {
          select: {
            productId: true,
            quantity: true,
            lineTotalDiscounted: true,
            product: { select: { title: true } }
          }
        }
      }
    }),
    prisma.order.findMany({
      where: { status: REVENUE_STATUS_FILTER, createdAt: { lt: from } },
      select: { userId: true, customerEmail: true }
    })
  ]);

  const buyerKey = makeBuyerKeyResolver(users);
  const buyersBeforePeriod = new Set(ordersBefore.map(buyerKey));

  type Bucket = { revenue: number; orders: number; newSet: Set<string>; returningSet: Set<string> };
  const buckets = new Map<string, Bucket>();
  const getBucket = (day: string): Bucket => {
    let bucket = buckets.get(day);
    if (!bucket) {
      bucket = { revenue: 0, orders: 0, newSet: new Set(), returningSet: new Set() };
      buckets.set(day, bucket);
    }
    return bucket;
  };

  // Покупатели, у которых уже был оплаченный заказ на момент обработки текущего заказа
  const seenBuyers = new Set(buyersBeforePeriod);
  const buyersInPeriod = new Set<string>();
  const productAgg = new Map<string, TopProduct>();

  let revenue = 0;

  for (const order of ordersInPeriod) {
    const key = buyerKey(order);
    const day = toDateInput(order.createdAt);
    const bucket = getBucket(day);
    const amount = orderRevenue(order);

    revenue += amount;
    bucket.revenue += amount;
    bucket.orders += 1;
    buyersInPeriod.add(key);

    // Покупатель попадает в срез дня один раз, даже если сделал несколько заказов
    if (!bucket.newSet.has(key) && !bucket.returningSet.has(key)) {
      if (seenBuyers.has(key)) bucket.returningSet.add(key);
      else bucket.newSet.add(key);
    }
    seenBuyers.add(key);

    for (const item of order.items) {
      const existing = productAgg.get(item.productId);
      const itemRevenue = item.lineTotalDiscounted;
      if (existing) {
        existing.quantity += item.quantity;
        existing.revenue += itemRevenue;
      } else {
        productAgg.set(item.productId, {
          productId: item.productId,
          title: item.product.title,
          quantity: item.quantity,
          revenue: itemRevenue
        });
      }
    }
  }

  let newBuyers = 0;
  for (const key of buyersInPeriod) {
    if (!buyersBeforePeriod.has(key)) newBuyers += 1;
  }

  const daily: DailyPoint[] = eachDay(from, to).map((date) => {
    const bucket = buckets.get(date);
    return {
      date,
      revenue: bucket ? Math.round(bucket.revenue * 100) / 100 : 0,
      orders: bucket?.orders ?? 0,
      newBuyers: bucket?.newSet.size ?? 0,
      returningBuyers: bucket?.returningSet.size ?? 0
    };
  });

  const topProducts = [...productAgg.values()]
    .map((p) => ({ ...p, revenue: Math.round(p.revenue * 100) / 100 }))
    .sort((a, b) => b.quantity - a.quantity || b.revenue - a.revenue)
    .slice(0, 10);

  const paidOrders = ordersInPeriod.length;

  return {
    revenue: Math.round(revenue * 100) / 100,
    paidOrders,
    averageCheck: paidOrders > 0 ? Math.round((revenue / paidOrders) * 100) / 100 : 0,
    uniqueBuyers: buyersInPeriod.size,
    newBuyers,
    returningBuyers: buyersInPeriod.size - newBuyers,
    daily,
    topProducts
  };
}
