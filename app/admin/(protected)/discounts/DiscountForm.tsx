"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Product = { id: string; title: string; slug: string };
type InitialValues = {
  percentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  productIds: string[];
};

function toDatetimeLocal(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function DiscountForm({
  products,
  discountId,
  initial
}: {
  products: Product[];
  discountId?: string;
  initial?: InitialValues;
}) {
  const router = useRouter();
  const isEdit = !!discountId;

  const [percentage, setPercentage] = useState(String(initial?.percentage ?? ""));
  const [startsAt, setStartsAt] = useState(initial?.startsAt ? toDatetimeLocal(initial.startsAt) : "");
  const [endsAt, setEndsAt] = useState(initial?.endsAt ? toDatetimeLocal(initial.endsAt) : "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [selectedProducts, setSelectedProducts] = useState<string[]>(initial?.productIds ?? []);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function toggleProduct(id: string) {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const pct = Number(percentage);
    if (!pct || pct <= 0 || pct > 100) { setError("Процент скидки: от 1 до 100"); return; }
    if (!startsAt || !endsAt) { setError("Укажите даты начала и окончания"); return; }
    if (new Date(startsAt) >= new Date(endsAt)) { setError("Дата начала должна быть раньше даты окончания"); return; }
    if (selectedProducts.length === 0) { setError("Выберите хотя бы один товар"); return; }

    setSaving(true);
    const body = {
      percentage: pct,
      startsAt: new Date(startsAt).toISOString(),
      endsAt: new Date(endsAt).toISOString(),
      isActive,
      productIds: selectedProducts
    };
    const res = await fetch(
      isEdit ? `/api/admin/discounts/${discountId}` : "/api/admin/discounts",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      }
    );
    setSaving(false);
    if (!res.ok) { setError("Ошибка сохранения"); return; }
    router.push("/admin/discounts");
    router.refresh();
  }

  async function handleDelete() {
    if (!discountId || !confirm("Удалить скидку?")) return;
    await fetch(`/api/admin/discounts/${discountId}`, { method: "DELETE" });
    router.push("/admin/discounts");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "grid", gap: 20, maxWidth: 560 }}>
      {error ? <p className="muted" style={{ margin: 0 }}>{error}</p> : null}

      <div>
        <label htmlFor="pct">Процент скидки (%)</label>
        <input
          id="pct"
          type="number"
          min={1}
          max={100}
          step={1}
          required
          value={percentage}
          onChange={(e) => setPercentage(e.target.value)}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div>
          <label htmlFor="starts">Начало действия</label>
          <input
            id="starts"
            type="datetime-local"
            required
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="ends">Конец действия</label>
          <input
            id="ends"
            type="datetime-local"
            required
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>

      <div>
        <div style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)", marginBottom: 10 }}>Товары</div>
        <div style={{ display: "grid", gap: 8 }}>
          {products.map((p) => (
            <label key={p.id} className="checkbox-line" style={{ cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={selectedProducts.includes(p.id)}
                onChange={() => toggleProduct(p.id)}
              />
              <span>{p.title}</span>
            </label>
          ))}
        </div>
      </div>

      <label className="checkbox-line">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        <span>Скидка активна</span>
      </label>

      <div style={{ display: "flex", gap: 12 }}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "..." : isEdit ? "Сохранить" : "Создать скидку"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "8px 16px", cursor: "pointer", fontSize: 13 }}
          >
            Удалить
          </button>
        )}
      </div>
    </form>
  );
}
