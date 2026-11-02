import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getFilteredCustomers, parseCustomerQuery } from "@/lib/db/customers";
import { CUSTOMER_STATUS_LABELS } from "@/lib/customers/constants";
import { toDateInput } from "@/lib/analytics/period";

// exceljs требует Node.js API (Buffer, zlib) и несовместим с edge-рантаймом
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = new URL(request.url).searchParams;
  // Тот же разбор и та же фильтрация, что и на странице, — без постраничной нарезки:
  // в файл попадают все найденные записи, а не только текущая страница.
  const query = parseCustomerQuery(params);
  const rows = await getFilteredCustomers(query);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Barrer Admin";
  workbook.created = new Date();

  const sheet = workbook.addWorksheet("Покупатели", {
    views: [{ state: "frozen", ySplit: 1 }]
  });

  sheet.columns = [
    { header: "ID пользователя", key: "id", width: 28 },
    { header: "Имя", key: "name", width: 24 },
    { header: "Email", key: "email", width: 30 },
    { header: "Телефон", key: "phone", width: 18 },
    { header: "Дата регистрации", key: "registeredAt", width: 18 },
    { header: "Первый оплаченный заказ", key: "firstOrderAt", width: 24 },
    { header: "Последний оплаченный заказ", key: "lastOrderAt", width: 26 },
    { header: "Количество заказов", key: "ordersCount", width: 20 },
    { header: "Общая сумма покупок, ₽", key: "totalSpent", width: 24 },
    { header: "Средний чек, ₽", key: "averageCheck", width: 18 },
    { header: "Статус", key: "status", width: 16 }
  ];

  const header = sheet.getRow(1);
  header.font = { bold: true };
  header.alignment = { vertical: "middle", horizontal: "left" };

  for (const row of rows) {
    sheet.addRow({
      id: row.id,
      name: row.name ?? "",
      email: row.email,
      phone: row.phone ?? "",
      registeredAt: row.registeredAt,
      firstOrderAt: row.firstOrderAt,
      lastOrderAt: row.lastOrderAt,
      ordersCount: row.ordersCount,
      totalSpent: row.totalSpent,
      averageCheck: row.averageCheck,
      status: CUSTOMER_STATUS_LABELS[row.status]
    });
  }

  // Даты и числа записываются нативными типами, чтобы в Excel работали сортировка и суммы
  sheet.getColumn("registeredAt").numFmt = "dd.mm.yyyy";
  sheet.getColumn("firstOrderAt").numFmt = "dd.mm.yyyy";
  sheet.getColumn("lastOrderAt").numFmt = "dd.mm.yyyy";
  sheet.getColumn("totalSpent").numFmt = "#,##0.00";
  sheet.getColumn("averageCheck").numFmt = "#,##0.00";
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: sheet.columns.length } };

  const buffer = await workbook.xlsx.writeBuffer();
  const filename = `customers-${toDateInput(new Date())}.xlsx`;

  return new Response(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String((buffer as ArrayBuffer).byteLength),
      "Cache-Control": "no-store"
    }
  });
}
