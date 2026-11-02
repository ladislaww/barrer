import Link from "next/link";
import { ProductForm } from "../ProductForm";

export default function NewProductPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <Link href="/admin/products" style={{ fontSize: 13, color: "var(--muted)" }}>
          ← Products
        </Link>
        <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>New Product</h1>
      </div>
      <ProductForm />
    </div>
  );
}
