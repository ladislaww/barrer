/**
 * Читает скачанные xlsx-файлы и сверяет их с данными базы покупателей.
 * Запуск: node --import tsx scripts/verify-export.ts <каталог-с-файлами>
 */
import ExcelJS from "exceljs";
import path from "node:path";
import { buildCustomerBase, filterCustomers, parseCustomerQuery } from "../lib/db/customers";
import { CUSTOMER_STATUS_LABELS } from "../lib/customers/constants";
import { prisma } from "../lib/db/prisma";

const dir = process.argv[2];
if (!dir) throw new Error("Укажите каталог с xlsx-файлами");

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

const EXPECTED_HEADERS = [
  "ID пользователя",
  "Имя",
  "Email",
  "Телефон",
  "Дата регистрации",
  "Первый оплаченный заказ",
  "Последний оплаченный заказ",
  "Количество заказов",
  "Общая сумма покупок, ₽",
  "Средний чек, ₽",
  "Статус"
];

type SheetRow = {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: unknown;
  firstOrderAt: unknown;
  lastOrderAt: unknown;
  ordersCount: unknown;
  totalSpent: unknown;
  averageCheck: unknown;
  status: string;
};

async function readSheet(file: string) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(path.join(dir, file));
  const sheet = workbook.worksheets[0];
  const headers: string[] = [];
  sheet.getRow(1).eachCell((cell, col) => {
    headers[col - 1] = String(cell.value ?? "");
  });
  const rows: SheetRow[] = [];
  for (let i = 2; i <= sheet.rowCount; i += 1) {
    const row = sheet.getRow(i);
    if (!row.getCell(1).value) continue;
    rows.push({
      id: String(row.getCell(1).value ?? ""),
      name: String(row.getCell(2).value ?? ""),
      email: String(row.getCell(3).value ?? ""),
      phone: String(row.getCell(4).value ?? ""),
      registeredAt: row.getCell(5).value,
      firstOrderAt: row.getCell(6).value,
      lastOrderAt: row.getCell(7).value,
      ordersCount: row.getCell(8).value,
      totalSpent: row.getCell(9).value,
      averageCheck: row.getCell(10).value,
      status: String(row.getCell(11).value ?? "")
    });
  }
  return { sheetName: sheet.name, headers, rows };
}

/** Ожидаемые строки из той же логики, что использует и страница. */
async function expectedFor(queryString: string) {
  const query = parseCustomerQuery(new URLSearchParams(queryString));
  const base = await buildCustomerBase();
  return filterCustomers(base, query);
}

const short = (email: string) => email.split("@")[0];

async function main() {
  console.log("\n[1] Структура файла");
  const all = await readSheet("export-all.xlsx");
  check("лист называется", all.sheetName, "Покупатели");
  check("заголовки столбцов", all.headers, EXPECTED_HEADERS);
  check("столбцов", all.headers.length, 11);

  console.log("\n[2] Экспорт без фильтров = вся база");
  const expectedAll = await expectedFor("");
  check("строк в файле", all.rows.length, expectedAll.length);
  check("порядок строк", all.rows.map((r) => short(r.email)), expectedAll.map((r) => short(r.email)));

  console.log("\n[3] Значения совпадают с базой");
  const byEmail = new Map(expectedAll.map((r) => [r.email, r]));
  let mismatches = 0;
  for (const row of all.rows) {
    const source = byEmail.get(row.email);
    if (!source) {
      mismatches += 1;
      continue;
    }
    const sameDate = (cell: unknown, date: Date) =>
      cell instanceof Date && cell.toDateString() === date.toDateString();
    const ok =
      row.id === source.id &&
      row.name === (source.name ?? "") &&
      row.phone === (source.phone ?? "") &&
      Number(row.ordersCount) === source.ordersCount &&
      Number(row.totalSpent) === source.totalSpent &&
      Number(row.averageCheck) === source.averageCheck &&
      row.status === CUSTOMER_STATUS_LABELS[source.status] &&
      sameDate(row.registeredAt, source.registeredAt) &&
      sameDate(row.firstOrderAt, source.firstOrderAt) &&
      sameDate(row.lastOrderAt, source.lastOrderAt);
    if (!ok) {
      mismatches += 1;
      console.log(`      расхождение по ${row.email}:`, JSON.stringify(row));
    }
  }
  check("строк с расхождениями", mismatches, 0);
  check("даты записаны как даты, а не текст", all.rows.every((r) => r.registeredAt instanceof Date), true);
  check("суммы записаны числами", all.rows.every((r) => typeof r.totalSpent === "number"), true);

  console.log("\n[4] Экспорт учитывает фильтры");
  const returning = await readSheet("export-returning.xlsx");
  const expectedReturning = await expectedFor("status=RETURNING&sort=totalSpent&dir=desc");
  check("фильтр статуса: строк", returning.rows.length, expectedReturning.length);
  check("фильтр статуса: порядок сортировки", returning.rows.map((r) => short(r.email)), expectedReturning.map((r) => short(r.email)));
  check("все строки со статусом «Повторный»", returning.rows.every((r) => r.status === "Повторный"), true);

  const search = await readSheet("export-search.xlsx");
  const expectedSearch = await expectedFor("q=vera");
  check("поиск q=vera: строк", search.rows.length, expectedSearch.length);
  check("поиск q=vera: найден нужный", search.rows.map((r) => short(r.email)), expectedSearch.map((r) => short(r.email)));

  console.log("\n[5] Экспорт игнорирует постраничную навигацию");
  const paged = await readSheet("export-paged.xlsx");
  check("page=2&perPage=10 отдаёт всю выборку", paged.rows.length, expectedAll.length);
  check("а не пустую страницу", paged.rows.length > 0, true);

  console.log("\n[6] Пустая выборка");
  const empty = await readSheet("export-empty.xlsx");
  check("строк данных нет", empty.rows.length, 0);
  check("заголовки на месте", empty.headers, EXPECTED_HEADERS);

  console.log(`\n${failed === 0 ? "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : "ЕСТЬ ОШИБКИ"}: ${passed} успешно, ${failed} провалено\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
