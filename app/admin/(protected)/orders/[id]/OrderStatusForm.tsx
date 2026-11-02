"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ORDER_STATUSES, ORDER_STATUS_META, type OrderStatus } from "@/lib/orders/status";

export function OrderStatusForm({
  orderId,
  currentStatus
}: {
  orderId: string;
  currentStatus: OrderStatus;
}) {
  const [status, setStatus] = useState<OrderStatus>(currentStatus);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleSave() {
    if (status === currentStatus) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      if (!res.ok) {
        setStatus(currentStatus);
        setError("Не удалось изменить статус. Попробуйте ещё раз.");
        return;
      }
      // Обновляем серверные данные: новый статус сразу виден и здесь, и в кабинете покупателя.
      router.refresh();
    } catch {
      setStatus(currentStatus);
      setError("Не удалось изменить статус. Попробуйте ещё раз.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: 12 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          disabled={saving}
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            color: "var(--text)",
            padding: "8px 12px",
            fontSize: 14,
            flex: 1,
            minWidth: 200
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {ORDER_STATUS_META[s].ru}
            </option>
          ))}
        </select>
        <button
          className="btn"
          onClick={handleSave}
          disabled={saving || status === currentStatus}
          style={{ padding: "8px 20px" }}
        >
          {saving ? "Сохранение..." : "Сохранить"}
        </button>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--muted)" }}>{ORDER_STATUS_META[status].hint}</p>
      {error && <p style={{ margin: 0, fontSize: 13, color: "#f44336" }}>{error}</p>}
    </div>
  );
}
