import type { OrderItem, OrderWithItems } from "@/lib/db/types";

export const round2 = (value: number) => Math.round(value * 100) / 100;

export type OrderTotals = {
  /** Общая сумма без скидки, в рублях */
  subtotal: number;
  /** Общая сумма со скидкой, в рублях */
  total: number;
  /** Сумма предоставленной скидки, в рублях */
  discount: number;
  /** Размер скидки в процентах от суммы без скидки */
  discountPct: number;
  /** Общее количество единиц товара в заказе */
  quantity: number;
};

type ItemLike = Pick<OrderItem, "quantity" | "lineTotal" | "lineTotalDiscounted">;

/**
 * Финансовые итоги заказа. Значения берутся из сохранённых полей заказа, но
 * пересчитываются из позиций, если поля пустые — так корректно отображаются
 * заказы, созданные до появления subtotalRub/discountRub.
 */
export function getOrderTotals(order: Pick<OrderWithItems, "total" | "totalRub" | "subtotalRub" | "discountRub"> & {
  items: ItemLike[];
}): OrderTotals {
  const total = round2(order.totalRub || order.total);
  const subtotal = round2(
    order.subtotalRub || order.items.reduce((sum, item) => sum + item.lineTotal, 0) || total
  );
  const discount = round2(order.discountRub || Math.max(0, subtotal - total));
  const quantity = order.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    subtotal,
    total,
    discount,
    discountPct: subtotal > 0 ? round2((discount / subtotal) * 100) : 0,
    quantity
  };
}
