"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "./CartContext";

export function CartView() {
  const { items, totalPrice, updateQuantity, removeFromCart } = useCart();

  useEffect(() => {
    items.forEach((item) => {
      if (item.product.stock != null && item.quantity > item.product.stock) {
        updateQuantity(item.product.id, item.product.stock);
      }
    });
  }, [items, updateQuantity]);

  if (items.length === 0) {
    return (
      <div className="card">
        <div className="mono">Cart empty</div>
        <p className="muted">Your archive is empty. Add something rare.</p>
        <Link href="/" className="btn secondary">
          Назад в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="grid" style={{ gap: 24 }}>
      {items.map((item) => (
        <div key={item.product.id} className="card">
          <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
            {item.product.images[0] ? (
              <Image
                src={item.product.images[0]}
                alt={item.product.title}
                width={96}
                height={128}
                style={{ width: 96, height: "auto", border: "1px solid var(--border)" }}
              />
            ) : null}
            <div>
              <div className="mono" style={{ color: "var(--accent)" }}>
                {item.product.title}
              </div>
              <div className="muted">€ {item.product.price}</div>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
              <label htmlFor={`qty-${item.product.id}`}>Qty</label>
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
                Удалить
              </button>
            </div>
          </div>
        </div>
      ))}
      <div className="card">
        <div className="mono">Total</div>
        <div style={{ fontSize: 24 }}>€ {totalPrice}</div>
        <Link
          href="/checkout"
          className="mono chip-link"
        >
          <span
            style={{
              display: "inline-block",
              padding: "2px 0",
              borderRadius: 999
            }}
          >
            Перейти к оформлению
          </span>
        </Link>
      </div>
    </div>
  );
}
