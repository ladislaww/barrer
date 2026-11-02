import { notFound } from "next/navigation";
import Link from "next/link";
import { getProductById } from "@/lib/db/products";
import { ProductForm } from "../ProductForm";

type Props = { params: Promise<{ id: string }> };

export default async function EditProductPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) notFound();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <Link href="/admin/products" style={{ fontSize: 13, color: "var(--muted)" }}>
          ← Products
        </Link>
        <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>Edit Product</h1>
      </div>
      <ProductForm product={product} />
    </div>
  );
}
