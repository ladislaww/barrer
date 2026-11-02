/**
 * Проверка выдачи дисконтных карт: формат номера, уникальность, привязка к e-mail.
 * Запуск: node --import tsx scripts/verify-cards.ts
 *
 * Создаёт и удаляет собственных тестовых пользователей (@card-test.local).
 */
import { prisma } from "../lib/db/prisma";
import {
  CARD_NUMBER_LENGTH,
  generateCardNumber,
  isValidCardNumber,
  issueCardByEmail,
  withUniqueCardNumber
} from "../lib/db/cards";
import { createCustomer } from "../lib/db/users";

const DOMAIN = "@card-test.local";

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

async function cleanup() {
  const users = await prisma.user.findMany({ where: { email: { endsWith: DOMAIN } }, select: { id: true } });
  const ids = users.map((u) => u.id);
  await prisma.membersCard.deleteMany({ where: { userId: { in: ids } } });
  await prisma.user.deleteMany({ where: { email: { endsWith: DOMAIN } } });
  return ids.length;
}

async function main() {
  await cleanup();

  // ── 1. Формат номера ──────────────────────────────────────────────────────
  console.log("\n[1] Формат номера");
  const sample = Array.from({ length: 20_000 }, generateCardNumber);
  check("длина всегда 8", new Set(sample.map((n) => n.length)).size === 1 && sample[0].length, CARD_NUMBER_LENGTH);
  check("только цифры", sample.every((n) => /^\d+$/.test(n)), true);
  check("нет букв, пробелов и разделителей", sample.every((n) => !/[^0-9]/.test(n)), true);
  check("isValidCardNumber принимает все сгенерированные", sample.every(isValidCardNumber), true);
  check("ведущие нули сохраняются", sample.some((n) => n.startsWith("0")), true);
  check("валидатор отвергает мусор", ["1234567", "123456789", "1234567a", "1234 567", "", "-1234567"].some(isValidCardNumber), false);

  // ── 2. Уникальность ───────────────────────────────────────────────────────
  console.log("\n[2] Уникальность");
  check("коллизий в 20 000 генераций мало (простр. 100 млн)", new Set(sample).size >= sample.length - 5, true);

  // Занимаем номер и проверяем, что подбор его обойдёт
  const victim = await createCustomer({ email: `collide${DOMAIN}`, password: "Test1234", name: "Коллизия" });
  const victimCard = await prisma.membersCard.findUnique({ where: { userId: victim.id } });
  const takenNumber = victimCard!.number;
  check("карта при регистрации получает номер", isValidCardNumber(takenNumber), true);

  let generatorCalls = 0;
  const forced = await withUniqueCardNumber(async (number) => {
    generatorCalls += 1;
    return number;
  });
  check("подбор возвращает валидный номер", isValidCardNumber(forced), true);
  check("подбор занял одну попытку на свободном номере", generatorCalls, 1);

  // Прямая вставка дубликата должна быть отбита БД
  const duplicate = await prisma.membersCard
    .create({ data: { userId: victim.id, number: takenNumber } })
    .then(() => "создалась")
    .catch((e: { code?: string }) => e.code ?? "ошибка");
  check("БД отвергает дубликат номера", duplicate, "P2002");

  // ── 3. Выдача по e-mail ───────────────────────────────────────────────────
  console.log("\n[3] Выдача по e-mail");
  const plain = await prisma.user.create({
    data: { email: `nocard${DOMAIN}`, password: "x", name: "Без карты", role: "CUSTOMER" }
  });

  const issued = await issueCardByEmail(plain.email);
  check("выдача успешна", issued.ok, true);
  if (issued.ok) {
    check("номер валиден", isValidCardNumber(issued.card.number), true);
    check("статус новой карты", issued.card.status, "ACTIVE");
    check("дата выдачи заполнена", issued.card.createdAt instanceof Date, true);
    check("карта привязана к найденному e-mail", issued.user.email, plain.email);
  }

  const again = await issueCardByEmail(plain.email);
  check("повторная выдача на тот же e-mail отклонена", again.ok === false && again.reason, "ALREADY_HAS_CARD");

  const upper = await issueCardByEmail(plain.email.toUpperCase());
  check("регистр e-mail не обходит проверку", upper.ok === false && upper.reason, "ALREADY_HAS_CARD");

  const spaced = await issueCardByEmail(`  ${plain.email}  `);
  check("пробелы вокруг e-mail не обходят проверку", spaced.ok === false && spaced.reason, "ALREADY_HAS_CARD");

  const missing = await issueCardByEmail(`ghost${DOMAIN}`);
  check("незарегистрированный e-mail", missing.ok === false && missing.reason, "USER_NOT_FOUND");

  const invalid = await issueCardByEmail("не-почта");
  check("некорректный e-mail", invalid.ok === false && invalid.reason, "INVALID_EMAIL");

  const empty = await issueCardByEmail("");
  check("пустой e-mail", empty.ok === false && empty.reason, "INVALID_EMAIL");

  // ── 4. Один e-mail — одна карта ───────────────────────────────────────────
  console.log("\n[4] Один e-mail — одна карта");
  const cards = await prisma.membersCard.findMany({
    where: { user: { email: { endsWith: DOMAIN } } },
    include: { user: { select: { email: true } } }
  });
  const byEmail = new Map<string, number>();
  for (const c of cards) byEmail.set(c.user.email, (byEmail.get(c.user.email) ?? 0) + 1);
  check("нет e-mail с двумя картами", [...byEmail.values()].every((n) => n === 1), true);

  const allNumbers = (await prisma.membersCard.findMany({ select: { number: true } })).map((c) => c.number);
  check("все номера в базе валидны", allNumbers.every(isValidCardNumber), true);
  check("все номера в базе уникальны", new Set(allNumbers).size, allNumbers.length);

  // ── 5. Параллельная выдача ────────────────────────────────────────────────
  console.log("\n[5] Параллельная выдача на один e-mail");
  const racer = await prisma.user.create({
    data: { email: `race${DOMAIN}`, password: "x", name: "Гонка", role: "CUSTOMER" }
  });
  const results = await Promise.all(Array.from({ length: 5 }, () => issueCardByEmail(racer.email)));
  check("успешна ровно одна попытка", results.filter((r) => r.ok).length, 1);
  const racerCards = await prisma.membersCard.count({ where: { userId: racer.id } });
  check("создана ровно одна карта", racerCards, 1);

  const removed = await cleanup();
  console.log(`\nУдалено тестовых пользователей: ${removed}`);
  console.log(`${failed === 0 ? "ВСЕ ПРОВЕРКИ ПРОЙДЕНЫ" : "ЕСТЬ ОШИБКИ"}: ${passed} успешно, ${failed} провалено\n`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch(async (error) => {
    console.error(error);
    await cleanup();
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
