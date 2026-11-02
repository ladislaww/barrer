import { prisma } from "./prisma";
import { REVENUE_STATUS_FILTER } from "./analytics";
import { makeBuyerKeyResolver } from "./buyer";
import { endOfDay, parseDateInput, startOfDay } from "@/lib/analytics/period";
import {
  CUSTOMER_SORT_KEYS,
  DEFAULT_PER_PAGE,
  INACTIVE_AFTER_DAYS,
  PER_PAGE_OPTIONS,
  type CustomerSortKey,
  type CustomerStatus
} from "@/lib/customers/constants";

export type { CustomerSortKey, CustomerStatus };

export type CustomerRow = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  registeredAt: Date;
  firstOrderAt: Date;
  lastOrderAt: Date;
  ordersCount: number;
  totalSpent: number;
  averageCheck: number;
  status: CustomerStatus;
};

export type CustomerQuery = {
  search: string;
  status: CustomerStatus | "ALL";
  firstFrom: Date | null;
  firstTo: Date | null;
  lastFrom: Date | null;
  lastTo: Date | null;
  ordersMin: number | null;
  ordersMax: number | null;
  spentMin: number | null;
  spentMax: number | null;
  sort: CustomerSortKey;
  dir: "asc" | "desc";
  page: number;
  perPage: number;
};

const STATUS_ORDER: Record<CustomerStatus, number> = { NEW: 0, RETURNING: 1, INACTIVE: 2 };

function toNumber(value: string | null): number | null {
  if (value === null || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseCustomerQuery(params: URLSearchParams): CustomerQuery {
  const rawStatus = params.get("status");
  const status: CustomerStatus | "ALL" =
    rawStatus === "NEW" || rawStatus === "RETURNING" || rawStatus === "INACTIVE" ? rawStatus : "ALL";

  const rawSort = params.get("sort");
  const sort: CustomerSortKey = CUSTOMER_SORT_KEYS.includes(rawSort as CustomerSortKey)
    ? (rawSort as CustomerSortKey)
    : "lastOrderAt";

  const perPageRaw = toNumber(params.get("perPage"));
  const perPage = perPageRaw && PER_PAGE_OPTIONS.includes(perPageRaw) ? perPageRaw : DEFAULT_PER_PAGE;

  const pageRaw = toNumber(params.get("page"));
  const page = pageRaw && pageRaw >= 1 ? Math.floor(pageRaw) : 1;

  const firstFrom = parseDateInput(params.get("firstFrom"));
  const firstTo = parseDateInput(params.get("firstTo"));
  const lastFrom = parseDateInput(params.get("lastFrom"));
  const lastTo = parseDateInput(params.get("lastTo"));

  return {
    search: (params.get("q") ?? "").trim(),
    status,
    firstFrom: firstFrom ? startOfDay(firstFrom) : null,
    firstTo: firstTo ? endOfDay(firstTo) : null,
    lastFrom: lastFrom ? startOfDay(lastFrom) : null,
    lastTo: lastTo ? endOfDay(lastTo) : null,
    ordersMin: toNumber(params.get("ordersMin")),
    ordersMax: toNumber(params.get("ordersMax")),
    spentMin: toNumber(params.get("spentMin")),
    spentMax: toNumber(params.get("spentMax")),
    sort,
    dir: params.get("dir") === "asc" ? "asc" : "desc",
    page,
    perPage
  };
}

function resolveStatus(ordersCount: number, lastOrderAt: Date, now: Date): CustomerStatus {
  const daysSinceLast = (now.getTime() - lastOrderAt.getTime()) / 86_400_000;
  // Неактивность имеет приоритет: давно не покупал — независимо от числа заказов
  if (daysSinceLast > INACTIVE_AFTER_DAYS) return "INACTIVE";
  return ordersCount >= 2 ? "RETURNING" : "NEW";
}

/**
 * База покупателей: зарегистрированные пользователи, у которых есть хотя бы один
 * оплаченный заказ. Заказ связывается с аккаунтом по userId, а гостевой заказ —
 * по совпадению e-mail, чтобы покупки до регистрации не терялись.
 */
export async function buildCustomerBase(now: Date = new Date()): Promise<CustomerRow[]> {
  const [users, paidOrders] = await Promise.all([
    prisma.user.findMany({
      select: { id: true, email: true, name: true, phone: true, createdAt: true }
    }),
    prisma.order.findMany({
      where: { status: REVENUE_STATUS_FILTER },
      orderBy: { createdAt: "asc" },
      select: {
        userId: true,
        customerEmail: true,
        customerPhone: true,
        total: true,
        totalRub: true,
        createdAt: true
      }
    })
  ]);

  const usersById = new Map(users.map((u) => [u.id, u]));
  const buyerKey = makeBuyerKeyResolver(users);

  type Agg = {
    ordersCount: number;
    totalSpent: number;
    firstOrderAt: Date;
    lastOrderAt: Date;
    lastPhone: string | null;
  };
  const aggregates = new Map<string, Agg>();

  for (const order of paidOrders) {
    const user = usersById.get(buyerKey(order));
    if (!user) continue; // гостевой заказ без аккаунта — вне базы покупателей

    const amount = order.totalRub || order.total;
    const existing = aggregates.get(user.id);
    if (existing) {
      existing.ordersCount += 1;
      existing.totalSpent += amount;
      if (order.createdAt < existing.firstOrderAt) existing.firstOrderAt = order.createdAt;
      if (order.createdAt >= existing.lastOrderAt) {
        existing.lastOrderAt = order.createdAt;
        existing.lastPhone = order.customerPhone || existing.lastPhone;
      }
    } else {
      aggregates.set(user.id, {
        ordersCount: 1,
        totalSpent: amount,
        firstOrderAt: order.createdAt,
        lastOrderAt: order.createdAt,
        lastPhone: order.customerPhone || null
      });
    }
  }

  const rows: CustomerRow[] = [];
  for (const [userId, agg] of aggregates) {
    const user = usersById.get(userId);
    if (!user) continue;
    const totalSpent = Math.round(agg.totalSpent * 100) / 100;
    rows.push({
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone || agg.lastPhone,
      registeredAt: user.createdAt,
      firstOrderAt: agg.firstOrderAt,
      lastOrderAt: agg.lastOrderAt,
      ordersCount: agg.ordersCount,
      totalSpent,
      averageCheck: Math.round((totalSpent / agg.ordersCount) * 100) / 100,
      status: resolveStatus(agg.ordersCount, agg.lastOrderAt, now)
    });
  }

  return rows;
}

function inRange(value: Date, from: Date | null, to: Date | null): boolean {
  if (from && value.getTime() < from.getTime()) return false;
  if (to && value.getTime() > to.getTime()) return false;
  return true;
}

/** Фильтрация + сортировка. Используется и таблицей, и выгрузкой в Excel. */
export function filterCustomers(rows: CustomerRow[], query: CustomerQuery): CustomerRow[] {
  const needle = query.search.toLowerCase();

  const filtered = rows.filter((row) => {
    if (needle) {
      const haystack = [row.name ?? "", row.email, row.phone ?? ""].join(" ").toLowerCase();
      if (!haystack.includes(needle)) return false;
    }
    if (query.status !== "ALL" && row.status !== query.status) return false;
    if (!inRange(row.firstOrderAt, query.firstFrom, query.firstTo)) return false;
    if (!inRange(row.lastOrderAt, query.lastFrom, query.lastTo)) return false;
    if (query.ordersMin !== null && row.ordersCount < query.ordersMin) return false;
    if (query.ordersMax !== null && row.ordersCount > query.ordersMax) return false;
    if (query.spentMin !== null && row.totalSpent < query.spentMin) return false;
    if (query.spentMax !== null && row.totalSpent > query.spentMax) return false;
    return true;
  });

  const factor = query.dir === "asc" ? 1 : -1;
  const collator = new Intl.Collator("ru");

  filtered.sort((a, b) => {
    let result: number;
    switch (query.sort) {
      case "name":
        result = collator.compare(a.name ?? "", b.name ?? "");
        break;
      case "email":
        result = collator.compare(a.email, b.email);
        break;
      case "status":
        result = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
        break;
      case "registeredAt":
        result = a.registeredAt.getTime() - b.registeredAt.getTime();
        break;
      case "firstOrderAt":
        result = a.firstOrderAt.getTime() - b.firstOrderAt.getTime();
        break;
      case "lastOrderAt":
        result = a.lastOrderAt.getTime() - b.lastOrderAt.getTime();
        break;
      case "ordersCount":
        result = a.ordersCount - b.ordersCount;
        break;
      case "totalSpent":
        result = a.totalSpent - b.totalSpent;
        break;
      case "averageCheck":
        result = a.averageCheck - b.averageCheck;
        break;
      default:
        result = 0;
    }
    // Стабильный порядок при равных значениях
    return result === 0 ? collator.compare(a.id, b.id) : result * factor;
  });

  return filtered;
}

/** Полный набор строк под текущие фильтры — основа и для таблицы, и для экспорта. */
export async function getFilteredCustomers(
  query: CustomerQuery,
  now: Date = new Date()
): Promise<CustomerRow[]> {
  const base = await buildCustomerBase(now);
  return filterCustomers(base, query);
}
