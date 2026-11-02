"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Card = {
  id: string;
  userId: string;
  number: string;
  status: string;
  createdAt: Date;
  user: { id: string; email: string; name: string | null; createdAt: Date };
};

/**
 * Список берётся напрямую из пропсов, без копии в useState: копия не обновлялась
 * при router.refresh(), и выданные карты не появлялись в таблице до перезагрузки.
 */
export function CardsTable({ cards }: { cards: Card[] }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function toggleStatus(userId: string, current: string) {
    setLoading(userId);
    const next = current === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await fetch("/api/admin/cards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, status: next })
    });
    router.refresh();
    setLoading(null);
  }

  if (cards.length === 0) {
    return <p className="muted">Карт пока нет. Карта создаётся автоматически при регистрации пользователя.</p>;
  }

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            {["Номер карты", "Пользователь", "Email", "Дата выдачи", "Статус карты", ""].map((h) => (
              <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "monospace", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => (
            <tr key={card.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <td style={{ padding: "12px 12px", fontFamily: "monospace", letterSpacing: "0.08em" }}>
                {card.number}
              </td>
              <td style={{ padding: "12px 12px" }}>{card.user.name ?? "—"}</td>
              <td style={{ padding: "12px 12px", color: "var(--muted)" }}>{card.user.email}</td>
              <td style={{ padding: "12px 12px", color: "var(--muted)" }}>
                {new Date(card.createdAt).toLocaleDateString("ru-RU")}
              </td>
              <td style={{ padding: "12px 12px" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: 11,
                    padding: "3px 8px",
                    border: "1px solid var(--border)",
                    borderRadius: 999,
                    color: card.status === "ACTIVE" ? "var(--text)" : "var(--muted)"
                  }}
                >
                  {card.status}
                </span>
              </td>
              <td style={{ padding: "12px 12px" }}>
                <button
                  className="btn secondary"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                  disabled={loading === card.userId}
                  onClick={() => toggleStatus(card.userId, card.status)}
                >
                  {card.status === "ACTIVE" ? "Деактивировать" : "Активировать"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
