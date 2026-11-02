/**
 * Тестовые данные для проверки аналитики и базы покупателей.
 * Запуск: node --import tsx scripts/seed-analytics-test.ts
 * Откат:  node --import tsx scripts/seed-analytics-test.ts --clean
 *
 * Все создаваемые записи помечены доменом @analytics-test.local,
 * поэтому чистятся выборочно и не задевают реальные данные.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const DOMAIN = "@analytics-test.local";

const d = (iso: string) => new Date(iso);

async function clean() {
  const users = await prisma.user.findMany({
    where: { email: { endsWith: DOMAIN } },
    select: { id: true }
  });
  const ids = users.map((u) => u.id);
  await prisma.order.deleteMany({
    where: { OR: [{ userId: { in: ids } }, { customerEmail: { endsWith: DOMAIN } }] }
  });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  console.log(`Удалено тестовых пользователей: ${ids.length}`);
}

async function main() {
  if (process.argv.includes("--clean")) {
    await clean();
    return;
  }

  await clean();

  const products = await prisma.product.findMany({ orderBy: { createdAt: "asc" }, take: 4 });
  if (products.length < 4) throw new Error("Нужно минимум 4 товара в базе");
  const [p1, p2, p3, p4] = products;

  async function user(email: string, name: string, createdAt: string) {
    return prisma.user.create({
      data: {
        email: `${email}${DOMAIN}`,
        name,
        password: "test-not-a-real-hash",
        phone: `+7900${Math.floor(1000000 + Math.random() * 8999999)}`,
        createdAt: d(createdAt),
        role: "CUSTOMER"
      }
    });
  }

  const u1 = await user("anna", "Анна Тестова", "2026-01-10T10:00:00");
  const u2 = await user("boris", "Борис Тестов", "2026-08-02T10:00:00");
  const u3 = await user("vera", "Вера Тестова", "2026-08-05T10:00:00");
  const u4 = await user("gleb", "Глеб Тестов", "2025-03-01T10:00:00");
  const u5 = await user("dmitry", "Дмитрий Тестов", "2024-06-01T10:00:00");

  // price — цена за единицу; в тестовых данных скидок нет, поэтому суммы со скидкой равны исходным.
  type ItemSpec = { productId: string; quantity: number; price: number };
  async function order(
    userId: string | null,
    email: string,
    createdAt: string,
    status: string,
    items: ItemSpec[]
  ) {
    const total = items.reduce((s, i) => s + i.price * i.quantity, 0);
    return prisma.order.create({
      data: {
        userId,
        customerEmail: email,
        customerPhone: "+79001234567",
        customerName: "Тест",
        total,
        totalRub: total,
        subtotalRub: total,
        discountRub: 0,
        currency: "RUB",
        exchangeRate: 1,
        displayTotal: total,
        status,
        createdAt: d(createdAt),
        items: {
          create: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
            unitPrice: i.price,
            unitPriceDiscounted: i.price,
            lineTotal: i.price * i.quantity,
            lineTotalDiscounted: i.price * i.quantity
          }))
        }
      }
    });
  }

  // --- Заказы ДО периода (август 2026) ---
  await order(u1.id, u1.email, "2026-07-15T12:00:00", "PAID", [
    { productId: p1.id, quantity: 1, price: 12000 }
  ]);
  await order(u4.id, u4.email, "2025-03-05T12:00:00", "PAID", [
    { productId: p4.id, quantity: 1, price: 4000 }
  ]);
  await order(u5.id, u5.email, "2025-01-10T12:00:00", "PAID", [
    { productId: p2.id, quantity: 1, price: 1000 }
  ]);
  await order(u5.id, u5.email, "2025-02-10T12:00:00", "PAID", [
    { productId: p2.id, quantity: 1, price: 2000 }
  ]);

  // --- Заказы В периоде, попадающие в выручку (PAID и DELIVERED) ---
  // Два заказа U1 в один день — проверяем, что покупатель в срезе дня считается один раз
  await order(u1.id, u1.email, "2026-08-03T11:00:00", "PAID", [
    { productId: p1.id, quantity: 2, price: 5000 }
  ]);
  await order(u1.id, u1.email, "2026-08-03T18:00:00", "PAID", [
    { productId: p2.id, quantity: 1, price: 5000 }
  ]);
  await order(u2.id, u2.email, "2026-08-04T12:00:00", "PAID", [
    { productId: p1.id, quantity: 1, price: 8000 },
    { productId: p3.id, quantity: 3, price: 4000 }
  ]);
  // Доставленный заказ остаётся в выручке наравне с оплаченным
  await order(u3.id, u3.email, "2026-08-10T12:00:00", "DELIVERED", [
    { productId: p4.id, quantity: 1, price: 3000 }
  ]);
  await order(u2.id, u2.email, "2026-08-20T12:00:00", "PAID", [
    { productId: p2.id, quantity: 1, price: 7000 }
  ]);
  // Гостевой заказ с e-mail зарегистрированного пользователя — должен склеиться с U3
  await order(null, u3.email, "2026-08-25T12:00:00", "PAID", [
    { productId: p4.id, quantity: 2, price: 3000 }
  ]);

  // --- Возвраты: не должны попадать в аналитику ---
  await order(u3.id, u3.email, "2026-08-11T12:00:00", "RETURNED", [
    { productId: p1.id, quantity: 50, price: 999999 }
  ]);
  await order(u3.id, u3.email, "2026-08-12T12:00:00", "RETURNED", [
    { productId: p2.id, quantity: 50, price: 888888 }
  ]);
  await order(u2.id, u2.email, "2026-08-15T12:00:00", "RETURNED", [
    { productId: p3.id, quantity: 50, price: 777777 }
  ]);

  console.log("Тестовые данные созданы.");
  console.log(`  U1 ${u1.email} · U2 ${u2.email} · U3 ${u3.email} · U4 ${u4.email} · U5 ${u5.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
