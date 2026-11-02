import { prisma } from "./prisma";

export async function listDiscounts() {
  return prisma.discount.findMany({
    orderBy: { createdAt: "desc" },
    include: { products: { include: { product: { select: { id: true, title: true, slug: true } } } } }
  });
}

export async function getDiscountById(id: string) {
  return prisma.discount.findUnique({
    where: { id },
    include: { products: { include: { product: { select: { id: true, title: true, slug: true } } } } }
  });
}

export async function createDiscount(data: {
  percentage: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  productIds: string[];
}) {
  return prisma.discount.create({
    data: {
      percentage: data.percentage,
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      isActive: data.isActive,
      products: { create: data.productIds.map((productId) => ({ productId })) }
    },
    include: { products: true }
  });
}

export async function updateDiscount(
  id: string,
  data: {
    percentage?: number;
    startsAt?: Date;
    endsAt?: Date;
    isActive?: boolean;
    productIds?: string[];
  }
) {
  const { productIds, ...rest } = data;
  if (productIds !== undefined) {
    await prisma.discountProduct.deleteMany({ where: { discountId: id } });
    if (productIds.length > 0) {
      await prisma.discountProduct.createMany({
        data: productIds.map((productId) => ({ discountId: id, productId }))
      });
    }
  }
  return prisma.discount.update({
    where: { id },
    data: rest,
    include: { products: true }
  });
}

export async function deleteDiscount(id: string) {
  return prisma.discount.delete({ where: { id } });
}

export async function getActiveDiscountsForUser(userId: string) {
  const card = await prisma.membersCard.findUnique({ where: { userId } });
  if (!card || card.status !== "ACTIVE") return [];

  const now = new Date();
  return prisma.discount.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: { products: { select: { productId: true } } }
  });
}

export function getDiscountPct(
  productId: string,
  discounts: { percentage: number; products: { productId: string }[] }[]
): number {
  let best = 0;
  for (const d of discounts) {
    if (d.products.some((p) => p.productId === productId)) {
      best = Math.max(best, d.percentage);
    }
  }
  return best;
}

export function applyDiscount(price: number, pct: number): number {
  if (pct <= 0) return price;
  return Math.round(price * (1 - pct / 100) * 100) / 100;
}
