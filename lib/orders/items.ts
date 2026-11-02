/**
 * Разбор позиций заказа, пришедших от клиента.
 *
 * Тело запроса приходит из браузера, поэтому количеству доверять нельзя:
 * отрицательное значение проходило проверку остатка (`stock < -3` — ложь),
 * давало отрицательную стоимость строки и увеличивало склад при списании.
 * Дубли одного товара тоже опасны: цикл проверок отрабатывает до цикла
 * списаний, поэтому две строки по 5 штук проходили проверку остатка 5
 * и уводили склад в минус. Здесь дубли схлопываются в одну позицию.
 */

/** Верхняя граница на позицию — защита от абсурдных значений в запросе. */
export const MAX_ITEM_QUANTITY = 100;

export type RawOrderItem = { productId: string; quantity: number };

export type NormalizeItemsResult =
  | { ok: true; items: RawOrderItem[] }
  | { ok: false; error: "EMPTY" | "INVALID_ITEM" | "QUANTITY_TOO_LARGE" };

export function normalizeOrderItems(input: unknown): NormalizeItemsResult {
  if (!Array.isArray(input) || input.length === 0) {
    return { ok: false, error: "EMPTY" };
  }

  const merged = new Map<string, number>();

  for (const raw of input) {
    if (!raw || typeof raw !== "object") return { ok: false, error: "INVALID_ITEM" };

    const { productId, quantity } = raw as Record<string, unknown>;

    if (typeof productId !== "string" || !productId.trim()) {
      return { ok: false, error: "INVALID_ITEM" };
    }
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) {
      return { ok: false, error: "INVALID_ITEM" };
    }

    const total = (merged.get(productId) ?? 0) + quantity;
    if (total > MAX_ITEM_QUANTITY) {
      return { ok: false, error: "QUANTITY_TOO_LARGE" };
    }
    merged.set(productId, total);
  }

  return {
    ok: true,
    items: [...merged].map(([productId, quantity]) => ({ productId, quantity }))
  };
}
