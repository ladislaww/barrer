import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getUserById, updateCustomerProfile } from "@/lib/db/users";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await getUserById(session.user.id);
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(user);
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  await updateCustomerProfile(session.user.id, {
    name: body.name ? String(body.name) : undefined,
    phone: body.phone ? String(body.phone) : undefined,
    city: body.city ? String(body.city) : undefined,
    street: body.street ? String(body.street) : undefined,
    house: body.house ? String(body.house) : undefined,
    building: body.building ? String(body.building) : undefined,
    postal: body.postal ? String(body.postal) : undefined,
    password: body.password && String(body.password).length >= 8 ? String(body.password) : undefined
  });

  return NextResponse.json({ ok: true });
}
