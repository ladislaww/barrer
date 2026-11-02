import { getProducts } from "@/lib/db/products";
import { DiscountForm } from "../DiscountForm";

export const metadata = { title: "Новая скидка — Admin" };

export default async function NewDiscountPage() {
  const products = await getProducts();

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Admin / Скидки</div>
        <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>Новая скидка</h1>
      </div>
      <DiscountForm products={products.map((p) => ({ id: p.id, title: p.title, slug: p.slug }))} />
    </div>
  );
}
