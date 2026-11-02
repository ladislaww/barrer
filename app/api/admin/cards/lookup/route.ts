import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { findUserWithCardByEmail } from "@/lib/db/cards";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const email = new URL(request.url).searchParams.get("email") ?? "";
  if (!email.trim()) {
    return NextResponse.json({ error: "Укажите e-mail" }, { status: 400 });
  }

  const user = await findUserWithCardByEmail(email);
  return NextResponse.json({ user });
}
