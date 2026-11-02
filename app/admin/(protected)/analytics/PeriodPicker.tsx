"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { PERIOD_OPTIONS, type PeriodKey } from "@/lib/analytics/period";

export function PeriodPicker({
  active,
  fromInput,
  toInput
}: {
  active: PeriodKey;
  fromInput: string;
  toInput: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [from, setFrom] = useState(fromInput);
  const [to, setTo] = useState(toInput);

  function selectPeriod(key: PeriodKey) {
    const params = new URLSearchParams({ period: key });
    if (key === "custom") {
      params.set("from", from);
      params.set("to", to);
    }
    startTransition(() => router.push(`/admin/analytics?${params.toString()}`));
  }

  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
      <div style={{ display: "flex", flexWrap: "wrap", border: "1px solid var(--border)", borderRadius: 999, overflow: "hidden" }}>
        {PERIOD_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => selectPeriod(option.key)}
            disabled={pending}
            style={{
              background: option.key === active ? "var(--text)" : "transparent",
              color: option.key === active ? "var(--bg)" : "var(--muted)",
              border: "none",
              padding: "8px 16px",
              fontSize: 12,
              fontFamily: "monospace",
              cursor: pending ? "wait" : "pointer",
              transition: "background 0.15s, color 0.15s"
            }}
          >
            {option.label}
          </button>
        ))}
      </div>

      {active === "custom" ? (
        <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          <input
            type="date"
            value={from}
            max={to}
            onChange={(event) => setFrom(event.target.value)}
            style={dateInputStyle}
          />
          <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
          <input
            type="date"
            value={to}
            min={from}
            onChange={(event) => setTo(event.target.value)}
            style={dateInputStyle}
          />
          <button
            type="button"
            className="btn secondary"
            style={{ fontSize: 12, padding: "6px 14px" }}
            disabled={pending}
            onClick={() => selectPeriod("custom")}
          >
            Применить
          </button>
        </div>
      ) : null}
    </div>
  );
}

const dateInputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "6px 10px",
  fontSize: 12,
  fontFamily: "monospace",
  colorScheme: "dark"
};
