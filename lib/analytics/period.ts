export type PeriodKey = "today" | "week" | "month" | "quarter" | "year" | "custom";

export const PERIOD_OPTIONS: { key: PeriodKey; label: string }[] = [
  { key: "today", label: "Сегодня" },
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "quarter", label: "Квартал" },
  { key: "year", label: "Год" },
  { key: "custom", label: "Произвольный" }
];

export type ResolvedPeriod = {
  key: PeriodKey;
  from: Date;
  to: Date;
  /** Значения для <input type="date"> */
  fromInput: string;
  toInput: string;
  label: string;
};

export function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

/** Локальная дата в формате YYYY-MM-DD (без сдвига в UTC, в отличие от toISOString). */
export function toDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateInput(value?: string | null): Date | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [y, m, d] = value.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;
  // Отсекаем несуществующие даты вида 2025-02-31
  if (date.getFullYear() !== y || date.getMonth() !== m - 1 || date.getDate() !== d) return null;
  return date;
}

function isPeriodKey(value: unknown): value is PeriodKey {
  return typeof value === "string" && PERIOD_OPTIONS.some((o) => o.key === value);
}

function formatRange(from: Date, to: Date): string {
  const fmt = (d: Date) => d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
  return `${fmt(from)} — ${fmt(to)}`;
}

/**
 * Календарные периоды (неделя с понедельника, месяц/квартал/год с 1-го числа),
 * правая граница ограничена концом сегодняшнего дня, чтобы графики не тянулись в будущее.
 */
export function resolvePeriod(
  key?: string | null,
  from?: string | null,
  to?: string | null,
  now: Date = new Date()
): ResolvedPeriod {
  const periodKey: PeriodKey = isPeriodKey(key) ? key : "month";
  const today = endOfDay(now);

  if (periodKey === "custom") {
    const parsedFrom = parseDateInput(from);
    const parsedTo = parseDateInput(to);
    let start = parsedFrom ?? new Date(now.getFullYear(), now.getMonth(), 1);
    let end = parsedTo ?? now;
    if (start.getTime() > end.getTime()) [start, end] = [end, start];
    const fromDate = startOfDay(start);
    const toDate = endOfDay(end);
    return {
      key: "custom",
      from: fromDate,
      to: toDate,
      fromInput: toDateInput(fromDate),
      toInput: toDateInput(toDate),
      label: formatRange(fromDate, toDate)
    };
  }

  let start: Date;
  switch (periodKey) {
    case "today":
      start = startOfDay(now);
      break;
    case "week": {
      // Понедельник как начало недели
      const offset = (now.getDay() + 6) % 7;
      const monday = new Date(now);
      monday.setDate(now.getDate() - offset);
      start = startOfDay(monday);
      break;
    }
    case "quarter": {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      start = new Date(now.getFullYear(), quarterMonth, 1);
      break;
    }
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "month":
    default:
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
  }

  return {
    key: periodKey,
    from: start,
    to: today,
    fromInput: toDateInput(start),
    toInput: toDateInput(today),
    label: formatRange(start, today)
  };
}

/** Список локальных дат YYYY-MM-DD включительно, для непрерывной оси графиков. */
export function eachDay(from: Date, to: Date): string[] {
  const days: string[] = [];
  const cursor = startOfDay(from);
  const last = startOfDay(to);
  // Защита от чрезмерно длинных диапазонов
  let guard = 0;
  while (cursor.getTime() <= last.getTime() && guard < 1500) {
    days.push(toDateInput(cursor));
    cursor.setDate(cursor.getDate() + 1);
    guard += 1;
  }
  return days;
}
