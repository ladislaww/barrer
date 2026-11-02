"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";
import { useDiscounts } from "./DiscountContext";
import {
  displayAmountRub,
  formatMoneyRub,
  localeCurrency,
  productTitle,
  USD_RATE_RUB
} from "@/lib/i18n";

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const { locale, t } = useLanguage();
  const { discountedPrice, getDiscountPct } = useDiscounts();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const discountedTotal = items.reduce(
    (sum, item) => sum + discountedPrice(item.product.price, item.product.id) * item.quantity,
    0
  );
  const hasDiscount = discountedTotal < totalPrice;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("submitting");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerEmail = String(formData.get("email") ?? "");
    const customerName = String(formData.get("name") ?? "").trim();
    const customerPhone = String(formData.get("phone") ?? "").trim();
    const offerAccepted = formData.get("offerAccepted") === "on";
    const privacyAccepted = formData.get("privacyAccepted") === "on";

    if (!offerAccepted || !privacyAccepted) {
      setStatus("idle");
      setError("Для оформления заказа нужно принять оферту и согласие на обработку персональных данных.");
      return;
    }

    const payload = {
      customerEmail,
      customerName,
      customerPhone,
      city: String(formData.get("city") ?? "").trim() || undefined,
      street: String(formData.get("street") ?? "").trim() || undefined,
      house: String(formData.get("house") ?? "").trim() || undefined,
      building: String(formData.get("building") ?? "").trim() || undefined,
      postal: String(formData.get("postal") ?? "").trim() || undefined,
      comment: String(formData.get("comment") ?? "").trim() || undefined,
      total: discountedTotal,
      totalRub: discountedTotal,
      currency: localeCurrency(locale),
      exchangeRate: locale === "en" ? USD_RATE_RUB : 1,
      displayTotal: displayAmountRub(discountedTotal, locale),
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discountPct: getDiscountPct(item.product.id)
      }))
    };
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setStatus("idle");
      setError(
        data.error === "Insufficient stock"
          ? t.insufficientStock
          : data.error === "Product unavailable"
            ? t.unavailableProduct
            : "Ошибка оформления. Попробуйте снова."
      );
      return;
    }
    clearCart();
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="card">
        <div className="mono">{t.orderCreated}</div>
        <p className="muted">{t.orderCreatedText}</p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="mono">{t.checkout}</div>
      {error ? <p style={{ color: "var(--muted)", margin: 0 }}>{error}</p> : null}
      {/* Состав заказа: покупатель должен видеть, что именно подтверждает. */}
      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 10 }}>
        {items.map((item) => {
          const unit = discountedPrice(item.product.price, item.product.id);
          return (
            <li
              key={item.product.id}
              style={{ display: "flex", gap: 12, alignItems: "baseline", flexWrap: "wrap" }}
            >
              <span style={{ flex: 1, minWidth: 160 }}>
                {productTitle(item.product, locale)}
                {item.quantity > 1 ? (
                  <span className="muted"> × {item.quantity}</span>
                ) : null}
              </span>
              <span className="mono" style={{ fontSize: 13 }}>
                {formatMoneyRub(unit * item.quantity, locale)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="divider" />
      {hasDiscount ? (
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ fontSize: 20 }}>{formatMoneyRub(discountedTotal, locale)}</div>
          <div className="muted" style={{ fontSize: 14, textDecoration: "line-through" }}>
            {formatMoneyRub(totalPrice, locale)}
          </div>
          <div className="muted" style={{ fontSize: 12 }}>Со скидкой Members Card</div>
        </div>
      ) : (
        <div style={{ fontSize: 20 }}>{formatMoneyRub(totalPrice, locale)}</div>
      )}
      <div>
        <label htmlFor="name">Имя</label>
        <input id="name" name="name" type="text" required />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required />
      </div>
      <div>
        <label htmlFor="phone">Телефон</label>
        <input id="phone" name="phone" type="tel" required />
      </div>
      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <label htmlFor="city">Город</label>
          <input id="city" name="city" type="text" required />
        </div>
        <div>
          <label htmlFor="street">Улица</label>
          <input id="street" name="street" type="text" required />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
          <div>
            <label htmlFor="house">Дом</label>
            <input id="house" name="house" type="text" required />
          </div>
          <div>
            <label htmlFor="building">Корпус</label>
            <input id="building" name="building" type="text" />
          </div>
          <div>
            <label htmlFor="postal">Почтовый индекс</label>
            <input id="postal" name="postal" type="text" required />
          </div>
        </div>
      </div>
      <div>
        <label htmlFor="comment">Комментарий к заказу</label>
        <textarea id="comment" name="comment" rows={3} />
      </div>
      <label className="checkbox-line">
        <input name="offerAccepted" type="checkbox" required />
        <span>
          Я ознакомлен(а) и согласен(на) с{" "}
          <Link href="/offer" className="nav-link">публичной офертой</Link>
        </span>
      </label>
      <label className="checkbox-line">
        <input name="privacyAccepted" type="checkbox" required />
        <span>
          Я даю согласие на{" "}
          <Link href="/privacy" className="nav-link">обработку персональных данных</Link>
        </span>
      </label>
      <button className="btn" type="submit" disabled={status === "submitting" || items.length === 0}>
        {status === "submitting" ? t.processing : t.checkoutSubmit}
      </button>
    </form>
  );
}
