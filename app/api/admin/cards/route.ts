import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { issueCardByEmail, listCardsWithUsers, updateCardStatus } from "@/lib/db/cards";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const cards = await listCardsWithUsers();
  return NextResponse.json({ cards });
}

/** Выдача карты по e-mail. */
export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body?.email !== "string") {
    return NextResponse.json({ ok: false, reason: "INVALID_EMAIL" }, { status: 400 });
  }

  const result = await issueCardByEmail(body.email);
  if (!result.ok) {
    const statusByReason = {
      INVALID_EMAIL: 400,
      USER_NOT_FOUND: 404,
      ALREADY_HAS_CARD: 409,
      GENERATION_FAILED: 500
    } as const;
    return NextResponse.json(result, { status: statusByReason[result.reason] });
  }
  return NextResponse.json(result, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await request.json().catch(() => null);
  if (!body?.userId || !["ACTIVE", "INACTIVE"].includes(body.status)) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  const card = await updateCardStatus(body.userId, body.status);
  return NextResponse.json({ card });
}
