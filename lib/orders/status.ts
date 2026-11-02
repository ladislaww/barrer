/**
 * Три статуса заказа. Заказ создаётся сразу оплаченным, дальше администратор
 * переводит его в «Доставлен» или «Возврат».
 */
export const ORDER_STATUSES = ["PAID", "DELIVERED", "RETURNED"] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

type StatusMeta = { ru: string; en: string; hint: string; color: string };

export const ORDER_STATUS_META: Record<OrderStatus, StatusMeta> = {
  PAID: {
    ru: "Оплачен",
    en: "Paid",
    hint: "Заказ успешно оплачен и ожидает доставки",
    color: "#4caf50"
  },
  DELIVERED: {
    ru: "Доставлен",
    en: "Delivered",
    hint: "Заказ передан покупателю",
    color: "#2f80ed"
  },
  RETURNED: {
    ru: "Возврат",
    en: "Returned",
    hint: "Заказ полностью или частично возвращён",
    color: "#f2994a"
  }
};

/** Статус, в котором заказ появляется после оформления. */
export const INITIAL_ORDER_STATUS: OrderStatus = "PAID";

/**
 * Статусы, которые считаются выручкой: доставленный заказ был оплачен,
 * поэтому остаётся в аналитике. Возвраты исключаются.
 */
export const REVENUE_ORDER_STATUSES: OrderStatus[] = ["PAID", "DELIVERED"];

export function isOrderStatus(value: unknown): value is OrderStatus {
  return typeof value === "string" && (ORDER_STATUSES as readonly string[]).includes(value);
}

export function orderStatusLabel(status: OrderStatus, locale: "ru" | "en" = "ru"): string {
  return ORDER_STATUS_META[status][locale];
}
