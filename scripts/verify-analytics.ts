/**
 * Проверка расчётов аналитики и базы покупателей на тестовых данных.
 * Запуск: node --import tsx scripts/verify-analytics.ts
 * Требует предварительного `node --import tsx scripts/seed-analytics-test.ts`.
 */
import { getAnalytics } from "../lib/db/analytics";
import { buildCustomerBase, filterCustomers, parseCustomerQuery } from "../lib/db/customers";
import { resolvePeriod, toDateInput } from "../lib/analytics/period";
import { prisma } from "../lib/db/prisma";

const NOW = new Date("2026-08-30T15:00:00");
const DOMAIN = "@analytics-test.local";

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

function params(query: string): URLSearchParams {
  return new URLSearchParams(query);
}

async function main() {
  const period = resolvePeriod("month", null, null, NOW);
  console.log(`\nПериод: ${period.label} (${toDateInput(period.from)} .. ${toDateInput(period.to)})`);

  // ── 1. Показатели дашборда ────────────────────────────────────────────────
  console.log("\n[1] Ключевые показатели (PAID + DELIVERED)");
  const a = await getAnalytics(period.from, period.to);
  check("выручка", a.revenue, 51000);
  check("заказов в выручке", a.paidOrders, 6);
  check("средний чек", a.averageCheck, 8500);
  check("уникальных покупателей", a.uniqueBuyers, 3);
  check("новых покупателей", a.newBuyers, 2);
  check("повторных покупателей", a.returningBuyers, 1);
  check("новые + повторные = уникальные", a.newBuyers + a.returningBuyers, a.uniqueBuyers);

  // ── 2. Возвраты исключены, доставленные учтены ───────────────────────────
  console.log("\n[2] RETURNED не попадает в расчёт, DELIVERED попадает");
  const returned = await prisma.order.findMany({
    where: { customerEmail: { endsWith: DOMAIN }, status: "RETURNED" },
    select: { totalRub: true }
  });
  const returnedSum = returned.reduce((s, o) => s + o.totalRub, 0);
  check("возвратов в базе", returned.length, 3);
  check("их сумма не в выручке", a.revenue < returnedSum, true);
  check("товары из возвратов не в топе", a.topProducts.every((p) => p.quantity < 50), true);

  const delivered = await prisma.order.count({
    where: { customerEmail: { endsWith: DOMAIN }, status: "DELIVERED" }
  });
  check("доставленных заказов в периоде", delivered, 1);
  check("доставленный заказ учтён в дне 08-10", a.daily.find((x) => x.date === "2026-08-10")?.revenue, 3000);

  // ── 3. Динамика по дням ──────────────────────────────────────────────────
  console.log("\n[3] Динамика по дням");
  const byDay = new Map(a.daily.map((d) => [d.date, d]));
  const day = (iso: string) => {
    const d = byDay.get(iso);
    return d ? [d.revenue, d.orders, d.newBuyers, d.returningBuyers] : null;
  };
  check("08-03 [выручка, заказы, новые, повторные]", day("2026-08-03"), [15000, 2, 0, 1]);
  check("08-04", day("2026-08-04"), [20000, 1, 1, 0]);
  check("08-10", day("2026-08-10"), [3000, 1, 1, 0]);
  check("08-20", day("2026-08-20"), [7000, 1, 0, 1]);
  check("08-25 (гостевой заказ склеен с аккаунтом)", day("2026-08-25"), [6000, 1, 0, 1]);
  check("08-11 (день с возвратом)", day("2026-08-11"), [0, 0, 0, 0]);
  check("дней на оси", a.daily.length, 30);
  check("сумма дневной выручки = итог", a.daily.reduce((s, d) => s + d.revenue, 0), a.revenue);
  check("сумма дневных заказов = итог", a.daily.reduce((s, d) => s + d.orders, 0), a.paidOrders);
  check("сумма дневных новых = новые за период", a.daily.reduce((s, d) => s + d.newBuyers, 0), a.newBuyers);

  // ── 4. Топ товаров ───────────────────────────────────────────────────────
  console.log("\n[4] Самые продаваемые товары");
  check(
    "топ [шт, выручка]",
    a.topProducts.map((p) => [p.quantity, p.revenue]),
    [[3, 18000], [3, 12000], [3, 9000], [2, 12000]]
  );
  check("выручка топа = выручка периода", a.topProducts.reduce((s, p) => s + p.revenue, 0), a.revenue);

  // ── 5. Периоды ───────────────────────────────────────────────────────────
  console.log("\n[5] Выбор периода");
  const today = resolvePeriod("today", null, null, NOW);
  check("сегодня — один день", toDateInput(today.from) === toDateInput(today.to), true);
  const week = resolvePeriod("week", null, null, NOW);
  check("неделя начинается с понедельника", week.from.getDay(), 1);
  check("квартал начинается с 01.07", toDateInput(resolvePeriod("quarter", null, null, NOW).from), "2026-07-01");
  check("год начинается с 01.01", toDateInput(resolvePeriod("year", null, null, NOW).from), "2026-01-01");
  const custom = resolvePeriod("custom", "2026-08-04", "2026-08-10", NOW);
  const customData = await getAnalytics(custom.from, custom.to);
  check("произвольный 04–10.08: выручка", customData.revenue, 23000);
  check("произвольный 04–10.08: заказов", customData.paidOrders, 2);
  const swapped = resolvePeriod("custom", "2026-08-10", "2026-08-04", NOW);
  check("перевёрнутый диапазон исправляется", [toDateInput(swapped.from), toDateInput(swapped.to)], ["2026-08-04", "2026-08-10"]);

  // ── 6. База покупателей ──────────────────────────────────────────────────
  console.log("\n[6] База покупателей");
  const base = await buildCustomerBase(NOW);
  const test = base.filter((r) => r.email.endsWith(DOMAIN));
  check("тестовых покупателей", test.length, 5);
  const byEmail = new Map(test.map((r) => [r.email.split("@")[0], r]));
  const row = (k: string) => {
    const r = byEmail.get(k);
    return r ? [r.ordersCount, r.totalSpent, r.averageCheck, r.status, toDateInput(r.firstOrderAt), toDateInput(r.lastOrderAt)] : null;
  };
  check("anna [заказов, сумма, чек, статус, первый, последний]", row("anna"), [3, 27000, 9000, "RETURNING", "2026-07-15", "2026-08-03"]);
  check("boris", row("boris"), [2, 27000, 13500, "RETURNING", "2026-08-04", "2026-08-20"]);
  check("vera (гостевой заказ учтён)", row("vera"), [2, 9000, 4500, "RETURNING", "2026-08-10", "2026-08-25"]);
  check("gleb (1 заказ, давно)", row("gleb"), [1, 4000, 4000, "INACTIVE", "2025-03-05", "2025-03-05"]);
  check("dmitry (2 заказа, но >90 дней → неактивный)", row("dmitry"), [2, 3000, 1500, "INACTIVE", "2025-01-10", "2025-02-10"]);
  check("пользователи без оплаченных заказов исключены", base.some((r) => r.ordersCount === 0), false);

  // ── 7. Поиск, фильтры, сортировка ────────────────────────────────────────
  console.log("\n[7] Поиск, фильтры, сортировка");
  const emails = (rows: { email: string }[]) => rows.map((r) => r.email.split("@")[0]);
  const q = (s: string) => filterCustomers(test, parseCustomerQuery(params(s)));

  check("поиск по имени", emails(q("q=Анна")), ["anna"]);
  check("поиск по email", emails(q("q=boris")), ["boris"]);
  check("поиск регистронезависим", emails(q("q=АННА")), ["anna"]);
  check("фильтр статуса RETURNING", emails(q("status=RETURNING&sort=email&dir=asc")), ["anna", "boris", "vera"]);
  check("фильтр статуса INACTIVE", emails(q("status=INACTIVE&sort=email&dir=asc")), ["dmitry", "gleb"]);
  check("заказов >= 2", emails(q("ordersMin=2&sort=email&dir=asc")), ["anna", "boris", "dmitry", "vera"]);
  check("заказов ровно 1", emails(q("ordersMin=1&ordersMax=1")), ["gleb"]);
  check("сумма от 10000", emails(q("spentMin=10000&sort=email&dir=asc")), ["anna", "boris"]);
  check("сумма 3000–9000", emails(q("spentMin=3000&spentMax=9000&sort=email&dir=asc")), ["dmitry", "gleb", "vera"]);
  check("первая покупка в 2026", emails(q("firstFrom=2026-01-01&sort=email&dir=asc")), ["anna", "boris", "vera"]);
  check("последняя покупка в августе 2026", emails(q("lastFrom=2026-08-01&lastTo=2026-08-31&sort=email&dir=asc")), ["anna", "boris", "vera"]);
  check("сортировка по сумме desc", emails(q("sort=totalSpent&dir=desc")).slice(0, 2), ["anna", "boris"]);
  check("сортировка по сумме asc", emails(q("sort=totalSpent&dir=asc"))[0], "dmitry");
  check("сортировка по среднему чеку desc", emails(q("sort=averageCheck&dir=desc"))[0], "boris");
  check("сортировка по последнему заказу desc", emails(q("sort=lastOrderAt&dir=desc"))[0], "vera");
  check("комбинация поиска и фильтра", emails(q("q=Тестов&status=INACTIVE&sort=email&dir=asc")), ["dmitry", "gleb"]);
  check("пустой результат", emails(q("q=несуществующий")), []);

  // ── 8. Пагинация ─────────────────────────────────────────────────────────
  console.log("\n[8] Пагинация");
  const all = filterCustomers(test, parseCustomerQuery(params("sort=email&dir=asc")));
  const pq = parseCustomerQuery(params("perPage=10"));
  check("perPage по умолчанию", parseCustomerQuery(params("")).perPage, 25);
  check("perPage=10 принят", pq.perPage, 10);
  check("некорректный perPage откатывается", parseCustomerQuery(params("perPage=999")).perPage, 25);
  check("страница по умолчанию", parseCustomerQuery(params("")).page, 1);
  const perPage = 2;
  const pages = [0, 1, 2].map((i) => emails(all.slice(i * perPage, (i + 1) * perPage)));
  check("страницы по 2", pages, [["anna", "boris"], ["dmitry", "gleb"], ["vera"]]);
  check("страницы покрывают всех без дублей", new Set(pages.flat()).size, all.length);

  // ── 9. Данные экспорта = данные таблицы ──────────────────────────────────
  console.log("\n[9] Экспорт использует ту же выборку");
  const exportQuery = parseCustomerQuery(params("status=RETURNING&sort=totalSpent&dir=desc"));
  const exportRows = filterCustomers(test, exportQuery);
  check("экспорт отдаёт все строки, не только страницу", exportRows.length, 3);
  check("порядок совпадает с таблицей", emails(exportRows), ["anna", "boris", "vera"]);
  check("средний чек = сумма / заказы", exportRows.every((r) => Math.abs(r.averageCheck - r.totalSpent / r.ordersCount) < 0.01), true);

  console.log(`\n${failed === 0 ? "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : "ЕСТЬ ОШИБКИ"}: ${passed} успешно, ${failed} провалено\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
