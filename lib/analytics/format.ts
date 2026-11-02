export function formatRub(value: number): string {
  return `${Math.round(value).toLocaleString("ru-RU")} ₽`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString("ru-RU");
}

export function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** Короткая подпись дня для оси графика: 05.03 */
export function formatDayLabel(isoDay: string): string {
  const [, m, d] = isoDay.split("-");
  return `${d}.${m}`;
}
