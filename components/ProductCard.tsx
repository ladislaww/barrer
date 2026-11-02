"use client";

import Link from "next/link";
import type { Product } from "@/lib/db/types";
import { AddToCartButton } from "./AddToCartButton";
import { ProductImage } from "./ProductImage";
import { useLanguage } from "./LanguageContext";
import { useDiscounts } from "./DiscountContext";
import { formatMoneyRub, productDescription, productTitle, type Locale } from "@/lib/i18n";

export function ProductCard({ product }: { product: Product }) {
  const { locale, t } = useLanguage();
  const { getDiscountPct, discountedPrice } = useDiscounts();
  const title = productTitle(product, locale);
  const pct = getDiscountPct(product.id);
  const finalPrice = discountedPrice(product.price, product.id);

  return (
    <div className="card">
      <div style={{ overflowX: "auto", scrollSnapType: "x mandatory", scrollbarWidth: "thin" }}>
        <div style={{ display: "flex" }}>
          {(product.images.length > 0 ? product.images : [null]).map((src, index) => (
            <div key={`${product.id}-${index}`} style={{ flex: "0 0 100%", scrollSnapAlign: "start" }}>
              <ProductImage
                src={src}
                alt={`${title} ${index + 1}`}
                width={640}
                height={800}
                style={{ width: "100%", height: "auto", border: "1px solid var(--border)" }}
              />
            </div>
          ))}
        </div>
      </div>
      <div className="mono" style={{ color: product.inStock ? "var(--text)" : "var(--muted)" }}>
        {product.inStock ? t.inStock : t.soldOut}
      </div>
      <Link href={`/products/${product.slug}`}>
        <h3 style={{ margin: 0, fontSize: 22 }}>{title}</h3>
      </Link>
      <p className="muted" style={{ margin: 0 }}>{productDescription(product, locale)}</p>
      <PriceDisplay price={product.price} finalPrice={finalPrice} pct={pct} locale={locale} />
      {product.inStock ? <AddToCartButton product={product} /> : null}
    </div>
  );
}

function PriceDisplay({
  price,
  finalPrice,
  pct,
  locale
}: {
  price: number;
  finalPrice: number;
  pct: number;
  locale: Locale;
}) {
  if (pct <= 0) {
    return <div style={{ fontSize: 18 }}>{formatMoneyRub(price, locale)}</div>;
  }
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
      <div style={{ fontSize: 18 }}>{formatMoneyRub(finalPrice, locale)}</div>
      <div className="muted" style={{ fontSize: 14, textDecoration: "line-through" }}>
        {formatMoneyRub(price, locale)}
      </div>
      <div
        style={{
          fontSize: 11,
          fontFamily: "monospace",
          padding: "2px 6px",
          border: "1px solid var(--text)",
          borderRadius: 999
        }}
      >
        −{pct}%
      </div>
    </div>
  );
}
