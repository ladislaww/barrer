"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  CUSTOMER_STATUS_LABELS,
  DEFAULT_PER_PAGE,
  PER_PAGE_OPTIONS,
  RANGE_FILTER_KEYS
} from "@/lib/customers/constants";

export type FiltersState = {
  q: string;
  status: string;
  firstFrom: string;
  firstTo: string;
  lastFrom: string;
  lastTo: string;
  ordersMin: string;
  ordersMax: string;
  spentMin: string;
  spentMax: string;
  perPage: string;
};

const EMPTY: FiltersState = {
  q: "",
  status: "ALL",
  firstFrom: "",
  firstTo: "",
  lastFrom: "",
  lastTo: "",
  ordersMin: "",
  ordersMax: "",
  spentMin: "",
  spentMax: "",
  perPage: String(DEFAULT_PER_PAGE)
};

/** Отбрасываем пустые значения, чтобы URL и ссылка на экспорт оставались читаемыми. */
function filtersToParams(state: FiltersState, sort: string, dir: string): URLSearchParams {
  const params = new URLSearchParams();
  if (state.q.trim()) params.set("q", state.q.trim());
  if (state.status && state.status !== "ALL") params.set("status", state.status);
  for (const key of RANGE_FILTER_KEYS) {
    if (state[key]) params.set(key, state[key]);
  }
  if (state.perPage && state.perPage !== String(DEFAULT_PER_PAGE)) params.set("perPage", state.perPage);
  if (sort) params.set("sort", sort);
  if (dir) params.set("dir", dir);
  return params;
}

export function CustomersFilters({
  initial,
  sort,
  dir,
  resultCount
}: {
  initial: FiltersState;
  sort: string;
  dir: string;
  resultCount: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<FiltersState>(initial);

  function update(patch: Partial<FiltersState>) {
    setState((prev) => ({ ...prev, ...patch }));
  }

  function apply(next: FiltersState = state) {
    // Любое изменение фильтров возвращает на первую страницу
    const params = filtersToParams(next, sort, dir);
    startTransition(() => router.push(`/admin/customers?${params.toString()}`));
  }

  function reset() {
    setState(EMPTY);
    startTransition(() => router.push("/admin/customers"));
  }

  const exportHref = `/api/admin/customers/export?${filtersToParams(state, sort, dir).toString()}`;

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
      className="card"
      style={{ gap: 16 }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div className="mono" style={{ fontSize: 11 }}>ФИЛЬТРЫ</div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span className="muted" style={{ fontSize: 12 }}>Найдено: {resultCount}</span>
          <a
            className="btn secondary"
            href={exportHref}
            style={{ fontSize: 12, padding: "6px 14px", textDecoration: "none" }}
          >
            Выгрузить в Excel
          </a>
        </div>
      </div>

      {/* 300px — минимум, при котором два date-инпута диапазона помещаются в колонку */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 12 }}>
        <Field label="Поиск (имя, email, телефон)">
          <input
            type="search"
            value={state.q}
            placeholder="Например: Иван или @mail.ru"
            onChange={(event) => update({ q: event.target.value })}
            style={inputStyle}
          />
        </Field>

        <Field label="Статус покупателя">
          <select value={state.status} onChange={(event) => update({ status: event.target.value })} style={inputStyle}>
            <option value="ALL">Все</option>
            {Object.entries(CUSTOMER_STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </Field>

        <Field label="Количество заказов">
          <RangeInputs
            minValue={state.ordersMin}
            maxValue={state.ordersMax}
            onMin={(v) => update({ ordersMin: v })}
            onMax={(v) => update({ ordersMax: v })}
            type="number"
          />
        </Field>

        <Field label="Сумма покупок, ₽">
          <RangeInputs
            minValue={state.spentMin}
            maxValue={state.spentMax}
            onMin={(v) => update({ spentMin: v })}
            onMax={(v) => update({ spentMax: v })}
            type="number"
          />
        </Field>

        <Field label="Первая покупка">
          <RangeInputs
            minValue={state.firstFrom}
            maxValue={state.firstTo}
            onMin={(v) => update({ firstFrom: v })}
            onMax={(v) => update({ firstTo: v })}
            type="date"
          />
        </Field>

        <Field label="Последняя покупка">
          <RangeInputs
            minValue={state.lastFrom}
            maxValue={state.lastTo}
            onMin={(v) => update({ lastFrom: v })}
            onMax={(v) => update({ lastTo: v })}
            type="date"
          />
        </Field>

        <Field label="Строк на странице">
          <select
            value={state.perPage}
            onChange={(event) => {
              const next = { ...state, perPage: event.target.value };
              setState(next);
              apply(next);
            }}
            style={inputStyle}
          >
            {PER_PAGE_OPTIONS.map((option) => (
              <option key={option} value={String(option)}>{option}</option>
            ))}
          </select>
        </Field>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button type="submit" className="btn" style={{ fontSize: 12, padding: "8px 18px" }} disabled={pending}>
          {pending ? "Применяем…" : "Применить"}
        </button>
        <button type="button" className="btn secondary" style={{ fontSize: 12, padding: "8px 18px" }} onClick={reset} disabled={pending}>
          Сбросить
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 6 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{label}</span>
      {children}
    </label>
  );
}

function RangeInputs({
  minValue,
  maxValue,
  onMin,
  onMax,
  type
}: {
  minValue: string;
  maxValue: string;
  onMin: (value: string) => void;
  onMax: (value: string) => void;
  type: "number" | "date";
}) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <input
        type={type}
        value={minValue}
        min={type === "number" ? 0 : undefined}
        placeholder={type === "number" ? "от" : undefined}
        onChange={(event) => onMin(event.target.value)}
        style={{ ...inputStyle, width: "100%" }}
      />
      <span style={{ color: "var(--muted)", fontSize: 12 }}>—</span>
      <input
        type={type}
        value={maxValue}
        min={type === "number" ? 0 : undefined}
        placeholder={type === "number" ? "до" : undefined}
        onChange={(event) => onMax(event.target.value)}
        style={{ ...inputStyle, width: "100%" }}
      />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg)",
  border: "1px solid var(--border)",
  color: "var(--text)",
  padding: "7px 10px",
  fontSize: 13,
  width: "100%",
  colorScheme: "dark"
};
