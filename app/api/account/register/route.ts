import { NextResponse } from "next/server";
import { createCustomer } from "@/lib/db/users";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);

  if (
    !body ||
    typeof body.email !== "string" ||
    typeof body.password !== "string" ||
    typeof body.name !== "string" ||
    body.password.length <= 6 ||
    !/[A-Z]/.test(body.password) ||
    body.offerAccepted !== true ||
    body.privacyAccepted !== true
  ) {
    return NextResponse.json({ error: "Invalid registration data" }, { status: 400 });
  }

  try {
    await createCustomer({
      email: body.email,
      password: body.password,
      name: body.name
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "User already exists" }, { status: 409 });
  }
}
