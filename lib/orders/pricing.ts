import { applyDiscount, getDiscountPct } from "@/lib/db/discounts";
import { round2 } from "./totals";

export type PricedOrderItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
  unitPriceDiscounted: number;
  lineTotal: number;
  lineTotalDiscounted: number;
};

export type PricedOrder = {
  items: PricedOrderItem[];
  subtotalRub: number;
  totalRub: number;
  discountRub: number;
  discountPct: number;
};

type DiscountLike = { percentage: number; products: { productId: string }[] };

/**
 * Считает суммы заказа по позициям. Каждая позиция получает цену за единицу и
 * стоимость строки — и без скидки, и со скидкой, — чтобы историю заказа можно было
 * показать без обращения к текущим ценам и акциям.
 */
export function priceOrderItems(
  items: Array<{ productId: string; quantity: number }>,
  priceOf: (productId: string) => number,
  discounts: DiscountLike[]
): PricedOrder {
  const priced = items.map((item) => {
    const unitPrice = priceOf(item.productId);
    const unitPriceDiscounted = applyDiscount(unitPrice, getDiscountPct(item.productId, discounts));
    return {
      productId: item.productId,
      quantity: item.quantity,
      unitPrice,
      unitPriceDiscounted,
      lineTotal: round2(unitPrice * item.quantity),
      lineTotalDiscounted: round2(unitPriceDiscounted * item.quantity)
    };
  });

  const subtotalRub = round2(priced.reduce((sum, item) => sum + item.lineTotal, 0));
  const totalRub = round2(priced.reduce((sum, item) => sum + item.lineTotalDiscounted, 0));
  const discountRub = round2(Math.max(0, subtotalRub - totalRub));

  return {
    items: priced,
    subtotalRub,
    totalRub,
    discountRub,
    discountPct: subtotalRub > 0 ? round2((discountRub / subtotalRub) * 100) : 0
  };
}
