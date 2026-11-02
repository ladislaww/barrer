"use client";

import { useEffect, useState } from "react";

type DiscountEntry = {
  id: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  products: { productId: string; product: { title: string; slug: string } }[];
};

type CardData = {
  status: "ACTIVE" | "INACTIVE";
  number: string | null;
  discounts: DiscountEntry[];
};

/** 00438455 → 0043 8455, так номер читается и запоминается легче */
function formatCardNumber(number: string) {
  return `${number.slice(0, 4)} ${number.slice(4)}`;
}

function fmt(d: string) {
  return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function MembersCard({ userName }: { userName: string | null }) {
  const [data, setData] = useState<CardData | null>(null);

  useEffect(() => {
    fetch("/api/account/discounts")
      .then((r) => r.json())
      .then((json) => {
        setData({
          status: json.cardStatus ?? "ACTIVE",
          number: json.cardNumber ?? null,
          discounts: json.discounts ?? []
        });
      })
      .catch(() => {});
  }, []);

  const active = data?.status === "ACTIVE";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      <div
        style={{
          background: active ? "var(--text)" : "var(--border)",
          color: active ? "var(--bg)" : "var(--muted)",
          borderRadius: 12,
          padding: "28px 28px 24px",
          display: "grid",
          gap: 20,
          position: "relative",
          overflow: "hidden",
          maxWidth: 380,
          transition: "background 0.3s"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ fontFamily: "monospace", fontSize: 11, letterSpacing: "0.15em", opacity: 0.6 }}>
            BARRER
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "0.2em",
              fontFamily: "monospace",
              padding: "3px 8px",
              border: `1px solid ${active ? "rgba(255,255,255,0.3)" : "var(--muted)"}`,
              borderRadius: 999
            }}
          >
            {active ? "ACTIVE" : "INACTIVE"}
          </div>
        </div>

        <div style={{ fontFamily: "monospace", fontSize: 13, letterSpacing: "0.08em" }}>
          MEMBERS CARD
        </div>

        {data?.number ? (
          <div style={{ fontFamily: "monospace", fontSize: 20, letterSpacing: "0.22em" }}>
            {formatCardNumber(data.number)}
          </div>
        ) : null}

        <div style={{ fontSize: 18, fontWeight: 600, letterSpacing: "0.02em" }}>
          {userName ?? "—"}
        </div>

        <div
          style={{
            position: "absolute",
            right: -30,
            bottom: -30,
            width: 120,
            height: 120,
            borderRadius: "50%",
            border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            pointerEvents: "none"
          }}
        />
        <div
          style={{
            position: "absolute",
            right: 10,
            bottom: 10,
            width: 60,
            height: 60,
            borderRadius: "50%",
            border: `1px solid ${active ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            pointerEvents: "none"
          }}
        />
      </div>

      {data && data.discounts.length > 0 ? (
        <div className="card">
          <div className="mono">Активные скидки</div>
          <div style={{ display: "grid", gap: 12 }}>
            {data.discounts.map((d) => (
              <div
                key={d.id}
                style={{ borderBottom: "1px solid var(--border)", paddingBottom: 12, display: "grid", gap: 6 }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 20, fontWeight: 600 }}>−{d.percentage}%</span>
                  <span className="muted" style={{ fontSize: 12 }}>
                    до {fmt(d.endsAt)}
                  </span>
                </div>
                <div className="muted" style={{ fontSize: 13 }}>
                  {d.products.map((p) => p.product.title).join(", ")}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : data && active ? (
        <p className="muted" style={{ margin: 0, fontSize: 13 }}>
          Активных скидок пока нет.
        </p>
      ) : null}
    </div>
  );
}
