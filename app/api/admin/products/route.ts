import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProducts, createProduct } from "@/lib/db/products";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await getProducts();
  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || !body.title || !body.slug || body.price == null) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  try {
    const product = await createProduct({
      title: String(body.title),
      titleEn: body.titleEn ? String(body.titleEn) : null,
      slug: String(body.slug),
      price: Number(body.price),
      stock: Number(body.stock ?? 0),
      inStock: Boolean(body.inStock ?? true),
      isVisible: Boolean(body.isVisible ?? true),
      description: String(body.description ?? ""),
      descriptionEn: body.descriptionEn ? String(body.descriptionEn) : null,
      details: Array.isArray(body.details) ? body.details.map(String) : [],
      detailsEn: Array.isArray(body.detailsEn) ? body.detailsEn.map(String) : [],
      images: Array.isArray(body.images) ? body.images.map(String) : []
    });
    return NextResponse.json(product, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Slug already taken or database error" }, { status: 409 });
  }
}
