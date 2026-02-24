import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/cms/queries";
import { AddToCartButton } from "@/components/AddToCartButton";
import { ProductGallery } from "@/components/ProductGallery";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="page">
      <div className="container" style={{ display: "grid", gap: 32 }}>
        <div className="mono">Edition {product.id}</div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            alignItems: "start"
          }}
        >
          <ProductGallery title={product.title} images={product.images} />
          <div className="card">
            <h1 style={{ fontSize: 36, margin: 0 }}>{product.title}</h1>
            <p className="muted">{product.description}</p>
            <div style={{ fontSize: 22 }}>€ {product.price}</div>
            <div>
              <div className="mono">Details</div>
              <ul style={{ margin: "12px 0", paddingLeft: 18, color: "var(--muted)" }}>
                {product.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            </div>
            {product.inStock ? <AddToCartButton product={product} /> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
