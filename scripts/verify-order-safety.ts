/**
 * Проверка защит оформления заказа и движения остатков.
 * Запуск: node --import tsx scripts/verify-order-safety.ts
 *
 * Покрывает:
 *  - нормализацию позиций (отрицательное/дробное количество, дубли товара);
 *  - возврат товара на склад при переводе заказа в RETURNED и обратно.
 *
 * Скрипт создаёт свои данные с доменом @safety-test.local и удаляет их за собой.
 */
import { prisma } from "../lib/db/prisma";
import { createOrder, updateOrderStatus } from "../lib/db/orders";
import { normalizeOrderItems, MAX_ITEM_QUANTITY } from "../lib/orders/items";

const DOMAIN = "@safety-test.local";
const SLUG_PREFIX = "safety-test-";

let passed = 0;
let failed = 0;

function check(label: string, actual: unknown, expected: unknown) {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  if (a === e) {
    passed += 1;
    console.log(`  ✓ ${label} = ${a}`);
  } else {
    failed += 1;
    console.log(`  ✗ ${label}\n      ожидалось: ${e}\n      получено:  ${a}`);
  }
}

async function clean() {
  await prisma.order.deleteMany({ where: { customerEmail: { endsWith: DOMAIN } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
}

async function main() {
  await clean();

  // ── Нормализация позиций ────────────────────────────────────────────────
  console.log("\nНормализация позиций заказа");

  const err = (input: unknown) => {
    const r = normalizeOrderItems(input);
    return r.ok ? "ok" : r.error;
  };

  check("пустой список отклоняется", err([]), "EMPTY");
  check("не массив отклоняется", err(null), "EMPTY");
  check("отрицательное количество отклоняется", err([{ productId: "p", quantity: -3 }]), "INVALID_ITEM");
  check("нулевое количество отклоняется", err([{ productId: "p", quantity: 0 }]), "INVALID_ITEM");
  check("дробное количество отклоняется", err([{ productId: "p", quantity: 1.5 }]), "INVALID_ITEM");
  check("количество строкой отклоняется", err([{ productId: "p", quantity: "2" }]), "INVALID_ITEM");
  check("пустой productId отклоняется", err([{ productId: "  ", quantity: 1 }]), "INVALID_ITEM");
  check(
    "превышение лимита отклоняется",
    err([{ productId: "p", quantity: MAX_ITEM_QUANTITY + 1 }]),
    "QUANTITY_TOO_LARGE"
  );
  check(
    "дубли суммируются и ловят лимит",
    err([
      { productId: "p", quantity: MAX_ITEM_QUANTITY },
      { productId: "p", quantity: 1 }
    ]),
    "QUANTITY_TOO_LARGE"
  );

  const dupes = normalizeOrderItems([
    { productId: "p", quantity: 5 },
    { productId: "p", quantity: 5 },
    { productId: "q", quantity: 2 }
  ]);
  check(
    "дубли схлопываются в одну позицию",
    dupes.ok ? dupes.items : dupes.error,
    [
      { productId: "p", quantity: 10 },
      { productId: "q", quantity: 2 }
    ]
  );

  // ── Возврат товара на склад ─────────────────────────────────────────────
  console.log("\nДвижение остатков при смене статуса");

  const product = await prisma.product.create({
    data: {
      slug: `${SLUG_PREFIX}coat`,
      title: "Safety Coat",
      price: 1000,
      stock: 10,
      inStock: true,
      description: "test"
    }
  });

  const order = await createOrder({
    customerEmail: `buyer${DOMAIN}`,
    customerPhone: "+70000000000",
    total: 3000,
    totalRub: 3000,
    subtotalRub: 3000,
    discountRub: 0,
    currency: "RUB",
    exchangeRate: 1,
    displayTotal: 3000,
    items: [
      {
        productId: product.id,
        quantity: 3,
        unitPrice: 1000,
        unitPriceDiscounted: 1000,
        lineTotal: 3000,
        lineTotalDiscounted: 3000
      }
    ]
  });

  const stock = async () =>
    (await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
      select: { stock: true, inStock: true }
    }));

  check("после заказа остаток списан", await stock(), { stock: 7, inStock: true });

  await updateOrderStatus(order.id, "DELIVERED");
  check("доставка остаток не двигает", await stock(), { stock: 7, inStock: true });

  await updateOrderStatus(order.id, "RETURNED");
  check("возврат вернул товар на склад", await stock(), { stock: 10, inStock: true });

  await updateOrderStatus(order.id, "RETURNED");
  check("повторный возврат ничего не меняет", await stock(), { stock: 10, inStock: true });

  await updateOrderStatus(order.id, "PAID");
  check("отмена возврата снова списала товар", await stock(), { stock: 7, inStock: true });

  // Возврат заказа на товар, который успели распродать в ноль.
  await prisma.product.update({ where: { id: product.id }, data: { stock: 0, inStock: false } });
  await updateOrderStatus(order.id, "RETURNED");
  check("возврат поднял товар из нулевого остатка", await stock(), { stock: 3, inStock: true });

  await clean();

  console.log(`\n${failed === 0 ? "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : "ЕСТЬ ОШИБКИ"}: ${passed} успешно, ${failed} провалено\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch(async (error) => {
    console.error(error);
    await clean().catch(() => {});
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
