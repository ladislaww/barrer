import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { normalizeEmail } from "./buyer";

/** Номер карты — ровно 8 цифр. Ведущие нули допустимы, поэтому это строка, а не число. */
export const CARD_NUMBER_LENGTH = 8;
const CARD_NUMBER_SPACE = 10 ** CARD_NUMBER_LENGTH; // 100 000 000 вариантов
const MAX_GENERATION_ATTEMPTS = 12;

export class CardNumberExhaustedError extends Error {
  constructor() {
    super("Не удалось подобрать свободный номер карты");
    this.name = "CardNumberExhaustedError";
  }
}

export function isValidCardNumber(value: string): boolean {
  return new RegExp(`^\\d{${CARD_NUMBER_LENGTH}}$`).test(value);
}

/** randomInt даёт равномерное распределение без смещения по модулю. */
export function generateCardNumber(): string {
  return String(randomInt(0, CARD_NUMBER_SPACE)).padStart(CARD_NUMBER_LENGTH, "0");
}

function isUniqueViolation(error: unknown, field: string): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === "P2002" &&
    (error.meta?.target as string[] | undefined)?.includes(field) === true
  );
}

/**
 * Выполняет запись, подставляя свободный номер карты, и повторяет при коллизии.
 *
 * Занятость проверяется до вставки, но полагаться только на проверку нельзя:
 * между SELECT и INSERT номер может занять параллельный запрос. Настоящая
 * гарантия — уникальный индекс в БД, поэтому нарушение P2002 по полю number
 * тоже трактуется как коллизия и приводит к следующей попытке.
 */
export async function withUniqueCardNumber<T>(action: (number: string) => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt += 1) {
    const number = generateCardNumber();

    const taken = await prisma.membersCard.findUnique({ where: { number }, select: { id: true } });
    if (taken) continue;

    try {
      return await action(number);
    } catch (error) {
      if (isUniqueViolation(error, "number")) continue;
      throw error;
    }
  }
  throw new CardNumberExhaustedError();
}

export function createCardWithNumber(userId: string, status: "ACTIVE" | "INACTIVE" = "ACTIVE") {
  return withUniqueCardNumber((number) =>
    prisma.membersCard.create({ data: { userId, number, status } })
  );
}

export type IssuedCard = { id: string; number: string; status: string; createdAt: Date };

export type IssueCardResult =
  | { ok: true; card: IssuedCard; user: { id: string; email: string; name: string | null } }
  | { ok: false; reason: "INVALID_EMAIL" | "USER_NOT_FOUND" | "ALREADY_HAS_CARD" | "GENERATION_FAILED" };

/**
 * Выдаёт карту по e-mail. Один адрес — одна карта: e-mail уникален в таблице User,
 * а userId уникален в MembersCard, поэтому повторная выдача на тот же адрес
 * отсекается и проверкой, и ограничением БД.
 */
export async function issueCardByEmail(rawEmail: string): Promise<IssueCardResult> {
  const email = normalizeEmail(rawEmail ?? "");
  if (!email || !email.includes("@")) return { ok: false, reason: "INVALID_EMAIL" };

  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true, name: true, card: { select: { id: true, number: true } } }
  });
  if (!user) return { ok: false, reason: "USER_NOT_FOUND" };
  if (user.card?.number) return { ok: false, reason: "ALREADY_HAS_CARD" };

  try {
    // Карта могла быть заведена до появления номеров — дозаполняем номер, а не создаём вторую
    const card = user.card
      ? await withUniqueCardNumber((number) =>
          prisma.membersCard.update({ where: { id: user.card!.id }, data: { number } })
        )
      : await createCardWithNumber(user.id);

    return {
      ok: true,
      card: { id: card.id, number: card.number!, status: card.status, createdAt: card.createdAt },
      user: { id: user.id, email: user.email, name: user.name }
    };
  } catch (error) {
    if (error instanceof CardNumberExhaustedError) return { ok: false, reason: "GENERATION_FAILED" };
    if (isUniqueViolation(error, "userId")) return { ok: false, reason: "ALREADY_HAS_CARD" };
    throw error;
  }
}

/** Поиск пользователя по e-mail для панели выдачи. */
export async function findUserWithCardByEmail(rawEmail: string) {
  const email = normalizeEmail(rawEmail ?? "");
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      card: { select: { id: true, number: true, status: true, createdAt: true } }
    }
  });
}

export async function getUserCard(userId: string) {
  return prisma.membersCard.findUnique({ where: { userId } });
}

export async function updateCardStatus(userId: string, status: "ACTIVE" | "INACTIVE") {
  const existing = await prisma.membersCard.findUnique({ where: { userId }, select: { id: true } });
  if (existing) {
    return prisma.membersCard.update({ where: { userId }, data: { status } });
  }
  // Карты ещё нет — создаём сразу с номером, чтобы не появилось записи без него
  return createCardWithNumber(userId, status);
}

export async function listCardsWithUsers() {
  return prisma.membersCard.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, email: true, name: true, createdAt: true } } }
  });
}
