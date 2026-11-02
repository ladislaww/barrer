import { getVisibleProducts } from "@/lib/db/products";
import { ProductCard } from "@/components/ProductCard";
import { CatalogTitle, HomeIntro } from "@/components/HomeIntro";

export default async function HomePage() {
  const products = await getVisibleProducts();

  return (
    <div className="page">
      <HomeIntro />
      <section id="catalog" className="container">
        <CatalogTitle />
        <div className="grid cols-3">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
