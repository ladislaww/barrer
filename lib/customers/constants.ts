/**
 * Константы базы покупателей, безопасные для клиентского бандла:
 * этот модуль не тянет за собой Prisma, в отличие от lib/db/customers.ts.
 */

/** Покупатель считается неактивным, если не покупал дольше этого срока. */
export const INACTIVE_AFTER_DAYS = 90;

export type CustomerStatus = "NEW" | "RETURNING" | "INACTIVE";

export const CUSTOMER_STATUS_LABELS: Record<CustomerStatus, string> = {
  NEW: "Новый",
  RETURNING: "Повторный",
  INACTIVE: "Неактивный"
};

export type CustomerSortKey =
  | "name"
  | "email"
  | "registeredAt"
  | "firstOrderAt"
  | "lastOrderAt"
  | "ordersCount"
  | "totalSpent"
  | "averageCheck"
  | "status";

export const CUSTOMER_SORT_KEYS: CustomerSortKey[] = [
  "name",
  "email",
  "registeredAt",
  "firstOrderAt",
  "lastOrderAt",
  "ordersCount",
  "totalSpent",
  "averageCheck",
  "status"
];

export const PER_PAGE_OPTIONS = [10, 25, 50, 100];

export const DEFAULT_PER_PAGE = 25;

/** Ключи диапазонных фильтров — общий список для формы и разбора URL. */
export const RANGE_FILTER_KEYS = [
  "firstFrom",
  "firstTo",
  "lastFrom",
  "lastTo",
  "ordersMin",
  "ordersMax",
  "spentMin",
  "spentMax"
] as const;

export type RangeFilterKey = (typeof RANGE_FILTER_KEYS)[number];
