/**
 * Проверка заказов с несколькими позициями, их сумм и статусов.
 * Запуск: node --import tsx scripts/verify-orders.ts
 *
 * Скрипт создаёт собственные товары/пользователей с доменом @orders-test.local
 * и удаляет их за собой, поэтому реальные данные не затрагиваются.
 */
import { prisma } from "../lib/db/prisma";
import {
  countOrdersByStatus,
  createOrder,
  getOrderById,
  getUserOrderById,
  listOrders,
  listOrdersByUser,
  parseOrderQuery,
  updateOrderStatus
} from "../lib/db/orders";
import { priceOrderItems } from "../lib/orders/pricing";
import { getOrderTotals } from "../lib/orders/totals";
import { isOrderStatus, ORDER_STATUSES } from "../lib/orders/status";

const DOMAIN = "@orders-test.local";
const SLUG_PREFIX = "orders-test-";

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
  const users = await prisma.user.findMany({ where: { email: { endsWith: DOMAIN } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.order.deleteMany({
    where: { OR: [{ userId: { in: ids } }, { customerEmail: { endsWith: DOMAIN } }] }
  });
  await prisma.discount.deleteMany({
    where: { products: { some: { product: { slug: { startsWith: SLUG_PREFIX } } } } }
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  await prisma.product.deleteMany({ where: { slug: { startsWith: SLUG_PREFIX } } });
}

async function main() {
  await clean();

  // ── Подготовка: два товара, покупатель с картой и скидка 20% на шорты ──────
  const shorts = await prisma.product.create({
    data: {
      slug: `${SLUG_PREFIX}shorts`,
      title: "Шорты",
      price: 5000,
      stock: 100,
      description: "тест"
    }
  });
  const soup = await prisma.product.create({
    data: {
      slug: `${SLUG_PREFIX}soup`,
      title: "Супки",
      price: 300,
      stock: 100,
      description: "тест"
    }
  });

  const buyer = await prisma.user.create({
    data: { email: `buyer${DOMAIN}`, password: "x", name: "Покупатель" }
  });
  const stranger = await prisma.user.create({
    data: { email: `stranger${DOMAIN}`, password: "x", name: "Чужой" }
  });

  const discounts = [{ percentage: 20, products: [{ productId: shorts.id }] }];

  // ── 1. Расчёт позиций ─────────────────────────────────────────────────────
  console.log("\n[1] Расчёт позиций заказа (шорты x3 со скидкой 20%, супки x4 без скидки)");
  const priceOf = (id: string) => (id === shorts.id ? shorts.price : soup.price);
  const priced = priceOrderItems(
    [
      { productId: shorts.id, quantity: 3 },
      { productId: soup.id, quantity: 4 }
    ],
    priceOf,
    discounts
  );

  const shortsLine = priced.items[0];
  const soupLine = priced.items[1];
  check("шорты: цена за ед. без скидки", shortsLine.unitPrice, 5000);
  check("шорты: цена за ед. со скидкой", shortsLine.unitPriceDiscounted, 4000);
  check("шорты: сумма позиции без скидки", shortsLine.lineTotal, 15000);
  check("шорты: сумма позиции со скидкой", shortsLine.lineTotalDiscounted, 12000);
  check("супки: скидки нет", [soupLine.unitPrice, soupLine.unitPriceDiscounted], [300, 300]);
  check("супки: суммы позиции", [soupLine.lineTotal, soupLine.lineTotalDiscounted], [1200, 1200]);
  check("итого без скидки", priced.subtotalRub, 16200);
  check("итого со скидкой", priced.totalRub, 13200);
  check("сумма скидки", priced.discountRub, 3000);
  check("процент скидки", priced.discountPct, 18.52);

  // ── 2. Сохранение заказа ──────────────────────────────────────────────────
  console.log("\n[2] Заказ сохраняет все поля позиций");
  const created = await createOrder({
    userId: buyer.id,
    customerEmail: buyer.email,
    customerPhone: "+79001234567",
    customerName: "Покупатель",
    total: priced.totalRub,
    totalRub: priced.totalRub,
    subtotalRub: priced.subtotalRub,
    discountRub: priced.discountRub,
    currency: "RUB",
    exchangeRate: 1,
    displayTotal: priced.totalRub,
    discountPct: priced.discountPct,
    items: priced.items
  });

  const saved = await getOrderById(created.id);
  if (!saved) throw new Error("Заказ не найден после создания");

  check("позиций в заказе", saved.items.length, 2);
  check("статус нового заказа", saved.status, "PAID");
  const savedShorts = saved.items.find((i) => i.productId === shorts.id)!;
  check(
    "шорты сохранены [кол-во, ед. без скидки, ед. со скидкой, сумма, сумма со скидкой]",
    [
      savedShorts.quantity,
      savedShorts.unitPrice,
      savedShorts.unitPriceDiscounted,
      savedShorts.lineTotal,
      savedShorts.lineTotalDiscounted
    ],
    [3, 5000, 4000, 15000, 12000]
  );
  check("название товара доступно из позиции", savedShorts.product.title, "Шорты");
  check("остаток товара списан", (await prisma.product.findUnique({ where: { id: shorts.id } }))!.stock, 97);

  // ── 3. Итоги заказа ───────────────────────────────────────────────────────
  console.log("\n[3] Итоги заказа");
  const totals = getOrderTotals(saved);
  check("сумма без скидки", totals.subtotal, 16200);
  check("сумма со скидкой", totals.total, 13200);
  check("размер скидки", [totals.discount, totals.discountPct], [3000, 18.52]);
  check("всего единиц товара", totals.quantity, 7);
  check("сумма позиций без скидки = итог", saved.items.reduce((s, i) => s + i.lineTotal, 0), totals.subtotal);
  check("сумма позиций со скидкой = итог", saved.items.reduce((s, i) => s + i.lineTotalDiscounted, 0), totals.total);
  check("итог со скидкой = итог без скидки − скидка", totals.subtotal - totals.discount, totals.total);

  // ── 4. Статусы ────────────────────────────────────────────────────────────
  console.log("\n[4] Статусы заказа");
  check("доступные статусы", [...ORDER_STATUSES], ["PAID", "DELIVERED", "RETURNED"]);
  check("старый статус не принимается", isOrderStatus("CREATED"), false);
  check("несуществующий статус не принимается", isOrderStatus("SHIPPED"), false);

  check("перевод в DELIVERED", (await updateOrderStatus(created.id, "DELIVERED"))?.status, "DELIVERED");
  check(
    "покупатель видит новый статус в списке",
    (await listOrdersByUser(buyer.id)).find((o) => o.id === created.id)?.status,
    "DELIVERED"
  );
  check(
    "покупатель видит новый статус в деталях",
    (await getUserOrderById(buyer.id, created.id))?.status,
    "DELIVERED"
  );
  check("перевод в RETURNED", (await updateOrderStatus(created.id, "RETURNED"))?.status, "RETURNED");
  check("несуществующий заказ не обновляется", await updateOrderStatus("no-such-id", "PAID"), null);

  // ── 5. Доступ покупателя к чужому заказу ──────────────────────────────────
  console.log("\n[5] Чужой заказ недоступен");
  check("чужой пользователь не получает заказ", await getUserOrderById(stranger.id, created.id), null);

  // ── 6. Фильтр и сортировка в админке ──────────────────────────────────────
  console.log("\n[6] Фильтр и сортировка заказов");
  await updateOrderStatus(created.id, "PAID");
  const second = await createOrder({
    userId: buyer.id,
    customerEmail: buyer.email,
    customerPhone: "+79001234567",
    total: 300,
    totalRub: 300,
    subtotalRub: 300,
    discountRub: 0,
    currency: "RUB",
    exchangeRate: 1,
    displayTotal: 300,
    items: [
      {
        productId: soup.id,
        quantity: 1,
        unitPrice: 300,
        unitPriceDiscounted: 300,
        lineTotal: 300,
        lineTotalDiscounted: 300
      }
    ]
  });
  await updateOrderStatus(second.id, "RETURNED");

  const testIds = new Set([created.id, second.id]);
  const onlyTest = <T extends { id: string }>(rows: T[]) => rows.filter((r) => testIds.has(r.id));

  check(
    "фильтр PAID",
    onlyTest(await listOrders({ status: "PAID" })).map((o) => o.id),
    [created.id]
  );
  check(
    "фильтр RETURNED",
    onlyTest(await listOrders({ status: "RETURNED" })).map((o) => o.id),
    [second.id]
  );
  check("фильтр DELIVERED пуст", onlyTest(await listOrders({ status: "DELIVERED" })).length, 0);
  check(
    "сортировка по сумме по возрастанию",
    onlyTest(await listOrders({ sort: "totalRub", dir: "asc" })).map((o) => o.totalRub),
    [300, 13200]
  );
  check(
    "сортировка по статусу: PAID раньше RETURNED",
    onlyTest(await listOrders({ sort: "status", dir: "asc" })).map((o) => o.status),
    ["PAID", "RETURNED"]
  );

  const counts = await countOrdersByStatus();
  check("счётчик ALL = сумма статусов", counts.PAID + counts.DELIVERED + counts.RETURNED, counts.ALL);

  // ── 7. Разбор параметров запроса ──────────────────────────────────────────
  console.log("\n[7] Разбор параметров списка заказов");
  const q = (s: string) => parseOrderQuery(new URLSearchParams(s));
  check("значения по умолчанию", q(""), { status: "ALL", sort: "createdAt", dir: "desc" });
  check("статус из строки запроса", q("status=DELIVERED").status, "DELIVERED");
  check("устаревший статус игнорируется", q("status=CANCELLED").status, "ALL");
  check("неизвестная сортировка игнорируется", q("sort=hack").sort, "createdAt");
  check("направление asc принимается", q("dir=asc").dir, "asc");

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
