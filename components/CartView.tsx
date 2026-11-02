"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useDiscounts } from "./DiscountContext";
import { ProductImage } from "./ProductImage";
import { useLanguage } from "./LanguageContext";
import { formatMoneyRub, productTitle } from "@/lib/i18n";

export function CartView() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();
  const { getDiscountPct, discountedPrice } = useDiscounts();
  const { locale, t } = useLanguage();

  useEffect(() => {
    items.forEach((item) => {
      if (item.product.stock != null && item.quantity > item.product.stock) {
        updateQuantity(item.product.id, item.product.stock);
      }
    });
  }, [items, updateQuantity]);

  const discountedTotal = items.reduce(
    (sum, item) => sum + discountedPrice(item.product.price, item.product.id) * item.quantity,
    0
  );
  const hasDiscount = discountedTotal < totalPrice;

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="mono">{t.cartEmpty}</div>
        <p className="muted">{t.cartEmptyText}</p>
        <Link href="/" className="btn secondary">{t.backToCatalog}</Link>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      {items.map((item) => {
        const pct = getDiscountPct(item.product.id);
        const dPrice = discountedPrice(item.product.price, item.product.id);
        return (
          <div key={item.product.id} className="card">
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <ProductImage
                src={item.product.images?.[0]}
                alt={productTitle(item.product, locale)}
                width={96}
                height={128}
                style={{ width: 96, height: 128, objectFit: "cover", flexShrink: 0 }}
              />
              <div style={{ flex: 1 }}>
                <div className="mono" style={{ color: "var(--accent)" }}>
                  {productTitle(item.product, locale)}
                </div>
                {pct > 0 ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                    <span>{formatMoneyRub(dPrice, locale)}</span>
                    <span className="muted" style={{ fontSize: 12, textDecoration: "line-through" }}>
                      {formatMoneyRub(item.product.price, locale)}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: "monospace", padding: "1px 5px", border: "1px solid var(--text)", borderRadius: 999 }}>
                      −{pct}%
                    </span>
                  </div>
                ) : (
                  <div className="muted">{formatMoneyRub(item.product.price, locale)}</div>
                )}
              </div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
                <label htmlFor={`qty-${item.product.id}`}>{t.quantity}</label>
                <input
                  id={`qty-${item.product.id}`}
                  type="number"
                  min={1}
                  max={item.product.stock ?? undefined}
                  value={item.quantity}
                  onChange={(event) => {
                    const raw = Number(event.target.value);
                    const max = item.product.stock ?? 999;
                    updateQuantity(item.product.id, Math.min(Math.max(1, raw), max));
                  }}
                  style={{ width: 80 }}
                />
                <button className="btn secondary" onClick={() => removeFromCart(item.product.id)}>
                  {t.remove}
                </button>
              </div>
            </div>
          </div>
        );
      })}
      <div className="card">
        <div className="mono">{t.total}</div>
        {hasDiscount ? (
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 24 }}>{formatMoneyRub(discountedTotal, locale)}</div>
            <div className="muted" style={{ fontSize: 14, textDecoration: "line-through" }}>
              {formatMoneyRub(totalPrice, locale)}
            </div>
            <div className="muted" style={{ fontSize: 12 }}>Со скидкой Members Card</div>
          </div>
        ) : (
          <div style={{ fontSize: 24 }}>{formatMoneyRub(totalPrice, locale)}</div>
        )}
        <Link href="/checkout" className="mono chip-link">
          <span style={{ display: "inline-block", padding: "2px 0", borderRadius: 999 }}>
            {t.proceedCheckout}
          </span>
        </Link>
      </div>
    </div>
  );
}
