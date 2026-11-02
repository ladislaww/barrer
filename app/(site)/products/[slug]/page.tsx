import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/db/products";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductInfo } from "@/components/ProductInfo";

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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 24,
            alignItems: "start"
          }}
        >
          <ProductGallery title={product.title} images={product.images} />
          <ProductInfo product={product} />
        </div>
      </div>
    </div>
  );
}
