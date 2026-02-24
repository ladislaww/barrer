"use client";

import { useState } from "react";
import { useCart } from "./CartContext";

export function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const [status, setStatus] = useState<"idle" | "submitting" | "done">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("submitting");
    const form = event.currentTarget;
    const formData = new FormData(form);
    const customerEmail = String(formData.get("email") ?? "");
    const customerPhone = String(formData.get("phone") ?? "").trim();
    const payload = {
      customerEmail,
      customerPhone,
      total: totalPrice,
      items: items.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity
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
      setError(data.error === "Insufficient stock" ? "Недостаточно товара на складе. Уменьшите количество или удалите позицию." : "Ошибка оформления. Попробуйте снова.");
      return;
    }
    clearCart();
    setStatus("done");
  };

  if (status === "done") {
    return (
      <div className="card">
        <div className="mono">Order created</div>
        <p className="muted">We will email the invoice and shipping details shortly.</p>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="mono">Checkout</div>
      {error ? <p style={{ color: "var(--muted)", margin: 0 }}>{error}</p> : null}
      <div className="muted">Items: {items.length}</div>
      <div style={{ fontSize: 20 }}>€ {totalPrice}</div>
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
      <button className="btn" type="submit" disabled={status === "submitting" || items.length === 0}>
        {status === "submitting" ? "Обработка..." : "Подтвердить и оплатить"}
      </button>
    </form>
  );
}
