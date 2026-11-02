"use client";

import type { Product } from "@/lib/db/types";
import { formatMoneyRub, productDescription, productDetails, productTitle } from "@/lib/i18n";
import { AddToCartButton } from "./AddToCartButton";
import { useLanguage } from "./LanguageContext";
import { useDiscounts } from "./DiscountContext";

export function ProductInfo({ product }: { product: Product }) {
  const { locale, t } = useLanguage();
  const { getDiscountPct, discountedPrice } = useDiscounts();
  const details = productDetails(product, locale);
  const pct = getDiscountPct(product.id);
  const finalPrice = discountedPrice(product.price, product.id);

  return (
    <div className="card">
      <h1 style={{ fontSize: 36, margin: 0 }}>{productTitle(product, locale)}</h1>
      <p className="muted">{productDescription(product, locale)}</p>
      {pct > 0 ? (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 26 }}>{formatMoneyRub(finalPrice, locale)}</span>
            <span
              style={{
                fontSize: 11,
                fontFamily: "monospace",
                padding: "3px 8px",
                border: "1px solid var(--text)",
                borderRadius: 999
              }}
            >
              −{pct}%
            </span>
          </div>
          <div className="muted" style={{ fontSize: 14, textDecoration: "line-through" }}>
            {formatMoneyRub(product.price, locale)}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Members Card скидка</div>
        </div>
      ) : (
        <div style={{ fontSize: 22 }}>{formatMoneyRub(product.price, locale)}</div>
      )}
      <div>
        <div className="mono">Details</div>
        <ul style={{ margin: "12px 0", paddingLeft: 18, color: "var(--muted)" }}>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      </div>
      {product.inStock ? <AddToCartButton product={product} /> : <div className="mono">{t.soldOut}</div>}
    </div>
  );
}
