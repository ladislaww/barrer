import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserCard } from "@/lib/db/cards";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ cardStatus: null, cardNumber: null, cardIssuedAt: null, discounts: [] });
  }

  const card = await getUserCard(session.user.id);
  if (!card || card.status !== "ACTIVE") {
    return NextResponse.json({
      cardStatus: card?.status ?? null,
      cardNumber: card?.number ?? null,
      cardIssuedAt: card?.createdAt ?? null,
      discounts: []
    });
  }

  const now = new Date();
  const discounts = await prisma.discount.findMany({
    where: { isActive: true, startsAt: { lte: now }, endsAt: { gte: now } },
    include: {
      products: {
        include: { product: { select: { id: true, title: true, slug: true } } }
      }
    }
  });

  return NextResponse.json({
    cardStatus: card.status,
    cardNumber: card.number,
    cardIssuedAt: card.createdAt,
    discounts
  });
}
