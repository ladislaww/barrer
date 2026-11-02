/**
 * Разовая миграция заказов под трёхстатусную модель и позиции с полными суммами.
 *
 * Порядок на боевой базе:
 *   1. node --import tsx scripts/migrate-orders-statuses.ts
 *   2. npx prisma db push --accept-data-loss     // удалит отработавший priceAtTime
 *
 * Скрипт работает через raw SQL и сам добавляет недостающие колонки, поэтому его
 * можно запускать на базе как до, так и после `db push`. Повторный запуск безопасен:
 * позиции с уже заполненным unitPrice не трогаются.
 *
 * Что делает:
 *   1. CREATED и PAID → PAID, FAILED и CANCELLED → RETURNED.
 *   2. Заполняет у позиций unitPrice / unitPriceDiscounted / lineTotal / lineTotalDiscounted.
 *      Старые записи хранили только priceAtTime (цену со скидкой), поэтому цена без скидки
 *      восстанавливается из агрегатного order.discountPct. Точность ограничена тем, что
 *      процент округлялся до целого — для исторических заказов это допустимо.
 *   3. Заполняет у заказов subtotalRub и discountRub.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const round2 = (value: number) => Math.round(value * 100) / 100;

async function columnsOf(table: string): Promise<Set<string>> {
  const rows = await prisma.$queryRawUnsafe<{ name: string }[]>(
    `PRAGMA table_info("${table}")`
  );
  return new Set(rows.map((r) => r.name));
}

async function ensureColumn(table: string, column: string, ddl: string, existing: Set<string>) {
  if (existing.has(column)) return;
  await prisma.$executeRawUnsafe(`ALTER TABLE "${table}" ADD COLUMN ${ddl}`);
  existing.add(column);
}

async function main() {
  const orderCols = await columnsOf("Order");
  const itemCols = await columnsOf("OrderItem");

  await ensureColumn("Order", "subtotalRub", `"subtotalRub" REAL NOT NULL DEFAULT 0`, orderCols);
  await ensureColumn("Order", "discountRub", `"discountRub" REAL NOT NULL DEFAULT 0`, orderCols);
  for (const col of ["unitPrice", "unitPriceDiscounted", "lineTotal", "lineTotalDiscounted"]) {
    await ensureColumn("OrderItem", col, `"${col}" REAL NOT NULL DEFAULT 0`, itemCols);
  }

  // На уже мигрированной базе колонки нет — тогда цена со скидкой лежит в unitPriceDiscounted.
  const legacyPrice = itemCols.has("priceAtTime") ? "priceAtTime" : "unitPriceDiscounted";

  const statusResult = await prisma.$executeRawUnsafe(`
    UPDATE "Order" SET status = CASE status
      WHEN 'CREATED'   THEN 'PAID'
      WHEN 'FAILED'    THEN 'RETURNED'
      WHEN 'CANCELLED' THEN 'RETURNED'
      ELSE status
    END
    WHERE status IN ('CREATED', 'FAILED', 'CANCELLED')
  `);

  const orders = await prisma.$queryRawUnsafe<
    { id: string; total: number; totalRub: number; discountPct: number; subtotalRub: number }[]
  >(`SELECT id, total, totalRub, discountPct, subtotalRub FROM "Order"`);

  let itemsFilled = 0;
  let ordersFilled = 0;

  for (const order of orders) {
    // Доля, оставшаяся после скидки: 0.9 при скидке 10%.
    const keepRatio =
      order.discountPct > 0 && order.discountPct < 100 ? 1 - order.discountPct / 100 : 1;

    const items = await prisma.$queryRawUnsafe<
      { id: string; quantity: number; legacy: number; unitPrice: number }[]
    >(
      `SELECT id, quantity, ${legacyPrice} AS legacy, unitPrice FROM "OrderItem" WHERE orderId = ?`,
      order.id
    );

    let subtotalRub = 0;

    for (const item of items) {
      const unitPriceDiscounted = item.legacy;
      const unitPrice = round2(unitPriceDiscounted / keepRatio);
      subtotalRub += unitPrice * item.quantity;

      if (item.unitPrice === 0) {
        await prisma.$executeRawUnsafe(
          `UPDATE "OrderItem"
             SET unitPrice = ?, unitPriceDiscounted = ?, lineTotal = ?, lineTotalDiscounted = ?
           WHERE id = ?`,
          unitPrice,
          unitPriceDiscounted,
          round2(unitPrice * item.quantity),
          round2(unitPriceDiscounted * item.quantity),
          item.id
        );
        itemsFilled += 1;
      }
    }

    subtotalRub = round2(subtotalRub);
    if (order.subtotalRub === 0 && subtotalRub > 0) {
      const totalRub = order.totalRub || order.total;
      await prisma.$executeRawUnsafe(
        `UPDATE "Order" SET subtotalRub = ?, discountRub = ? WHERE id = ?`,
        subtotalRub,
        round2(Math.max(0, subtotalRub - totalRub)),
        order.id
      );
      ordersFilled += 1;
    }
  }

  console.log(`Заказов просмотрено:  ${orders.length}`);
  console.log(`  статус изменён:     ${statusResult}`);
  console.log(`  суммы заполнены:    ${ordersFilled}`);
  console.log(`  позиций заполнено:  ${itemsFilled}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
