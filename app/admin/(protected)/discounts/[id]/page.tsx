import { notFound } from "next/navigation";
import { getDiscountById } from "@/lib/db/discounts";
import { getProducts } from "@/lib/db/products";
import { DiscountForm } from "../DiscountForm";

export const metadata = { title: "Редактировать скидку — Admin" };

type Props = { params: Promise<{ id: string }> };

export default async function EditDiscountPage({ params }: Props) {
  const { id } = await params;
  const [discount, products] = await Promise.all([getDiscountById(id), getProducts()]);

  if (!discount) notFound();

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Admin / Скидки</div>
        <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>Редактировать скидку</h1>
      </div>
      <DiscountForm
        products={products.map((p) => ({ id: p.id, title: p.title, slug: p.slug }))}
        discountId={id}
        initial={{
          percentage: discount.percentage,
          startsAt: discount.startsAt.toISOString(),
          endsAt: discount.endsAt.toISOString(),
          isActive: discount.isActive,
          productIds: discount.products.map((p) => p.productId)
        }}
      />
    </div>
  );
}
