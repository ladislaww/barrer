import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getProductById, updateProduct, deleteProduct } from "@/lib/db/products";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: Ctx) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  try {
    const product = await updateProduct(id, {
      title: body.title != null ? String(body.title) : undefined,
      titleEn: body.titleEn != null ? String(body.titleEn) : undefined,
      slug: body.slug != null ? String(body.slug) : undefined,
      price: body.price != null ? Number(body.price) : undefined,
      stock: body.stock != null ? Number(body.stock) : undefined,
      inStock: body.inStock != null ? Boolean(body.inStock) : undefined,
      isVisible: body.isVisible != null ? Boolean(body.isVisible) : undefined,
      description: body.description != null ? String(body.description) : undefined,
      descriptionEn: body.descriptionEn != null ? String(body.descriptionEn) : undefined,
      details: Array.isArray(body.details) ? body.details.map(String) : undefined,
      detailsEn: Array.isArray(body.detailsEn) ? body.detailsEn.map(String) : undefined,
      images: Array.isArray(body.images) ? body.images.map(String) : undefined
    });
    return NextResponse.json(product);
  } catch {
    return NextResponse.json({ error: "Slug already taken or database error" }, { status: 409 });
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    await deleteProduct(id);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Cannot delete product with existing orders" }, { status: 409 });
  }
}
