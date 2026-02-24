import { getProducts } from "@/lib/cms/queries";
import { ProductCard } from "@/components/ProductCard";

export default async function HomePage() {
  const products = await getProducts();

  return (
    <div className="page">
      <section className="container" style={{ marginBottom: 64 }}>
        <div className="mono">Archive 01</div>
        <h1 style={{ fontSize: 48, margin: "16px 0" }}>Shadowsculpt Collection</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          A quiet uniform for the night city. Heavy textures, controlled volume, and muted
          structure.
        </p>
      </section>

      <section id="catalog" className="container">
        <div className="mono" style={{ marginBottom: 16 }}>
          Catalog
        </div>
        <div className="grid cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
