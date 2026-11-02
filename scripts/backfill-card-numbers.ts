/**
 * Проставляет номера картам, заведённым до появления поля number.
 * Идемпотентен: карты с заполненным номером пропускаются.
 *
 * Порядок обновления базы с существующими картами (SQLite не умеет добавлять
 * NOT NULL UNIQUE колонку к непустой таблице одним шагом):
 *   1. в schema.prisma временно `number String? @unique` → prisma db push
 *   2. node --import tsx scripts/backfill-card-numbers.ts
 *   3. вернуть `number String  @unique` → prisma db push
 *
 * Поиск идёт сырым SQL: в актуальной схеме number уже NOT NULL, поэтому
 * типы Prisma не позволяют искать по null.
 */
import { prisma } from "../lib/db/prisma";
import { withUniqueCardNumber } from "../lib/db/cards";

async function main() {
  const pending = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM MembersCard WHERE number IS NULL OR number = ''
  `;

  if (pending.length === 0) {
    console.log("Карт без номера нет.");
    return;
  }

  for (const card of pending) {
    const updated = await withUniqueCardNumber((number) =>
      prisma.membersCard.update({ where: { id: card.id }, data: { number } })
    );
    console.log(`  ${card.id} → ${updated.number}`);
  }
  console.log(`Проставлено номеров: ${pending.length}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
