import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { listOrders } from "@/lib/db/orders";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const orders = await listOrders();
  return NextResponse.json(orders);
}
