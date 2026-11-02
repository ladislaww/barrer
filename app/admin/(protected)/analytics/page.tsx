import { getAnalytics } from "@/lib/db/analytics";
import { resolvePeriod } from "@/lib/analytics/period";
import { formatNumber, formatRub } from "@/lib/analytics/format";
import { PeriodPicker } from "./PeriodPicker";
import { BarChartCard } from "./Charts";

export const metadata = { title: "Аналитика — Admin" };
export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

function first(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

/** Компактные подписи оси: 1 200 000 → 1.2M */
function compact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return String(Math.round(value));
}

export default async function AnalyticsPage({ searchParams }: Props) {
  const sp = await searchParams;
  const period = resolvePeriod(first(sp.period), first(sp.from), first(sp.to));
  const data = await getAnalytics(period.from, period.to);

  const revenuePoints = data.daily.map((d) => ({ date: d.date, values: [d.revenue] }));
  const orderPoints = data.daily.map((d) => ({ date: d.date, values: [d.orders] }));
  const buyerPoints = data.daily.map((d) => ({ date: d.date, values: [d.newBuyers, d.returningBuyers] }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, marginBottom: 8 }}>ANALYTICS</div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Аналитика</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
          Период: {period.label}. В расчёт входят только оплаченные заказы (PAID).
        </p>
      </div>

      <PeriodPicker active={period.key} fromInput={period.fromInput} toInput={period.toInput} />

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 16 }}>
        <StatCard label="Выручка" value={formatRub(data.revenue)} />
        <StatCard label="Оплаченных заказов" value={formatNumber(data.paidOrders)} />
        <StatCard label="Средний чек" value={formatRub(data.averageCheck)} />
        <StatCard label="Уникальных покупателей" value={formatNumber(data.uniqueBuyers)} />
        <StatCard label="Новых покупателей" value={formatNumber(data.newBuyers)} />
        <StatCard label="Повторных покупателей" value={formatNumber(data.returningBuyers)} />
      </div>

      <BarChartCard
        title="ВЫРУЧКА ПО ДНЯМ"
        data={revenuePoints}
        series={[{ label: "Выручка", color: "#4caf50" }]}
        formatValue={compact}
      />

      <BarChartCard
        title="ЗАКАЗЫ ПО ДНЯМ"
        data={orderPoints}
        series={[{ label: "Заказы", color: "#8ab4f8" }]}
        formatValue={compact}
      />

      <BarChartCard
        title="НОВЫЕ И ПОВТОРНЫЕ ПОКУПАТЕЛИ"
        data={buyerPoints}
        series={[
          { label: "Новые", color: "#f4f4f4" },
          { label: "Повторные", color: "#7a7a7a" }
        ]}
        formatValue={compact}
      />

      <div className="card" style={{ gap: 16 }}>
        <div className="mono" style={{ fontSize: 11 }}>САМЫЕ ПРОДАВАЕМЫЕ ТОВАРЫ</div>
        {data.topProducts.length === 0 ? (
          <div style={{ padding: "24px 0", textAlign: "center", color: "var(--muted)", fontSize: 13 }}>
            Нет продаж за выбранный период
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <Th>Товар</Th>
                  <Th align="right">Продано, шт.</Th>
                  <Th align="right">Выручка</Th>
                </tr>
              </thead>
              <tbody>
                {data.topProducts.map((product) => (
                  <tr key={product.productId} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 0" }}>{product.title}</td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "monospace" }}>
                      {formatNumber(product.quantity)}
                    </td>
                    <td style={{ padding: "12px 0", textAlign: "right", fontFamily: "monospace" }}>
                      {formatRub(product.revenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="card" style={{ gap: 8 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      style={{
        textAlign: align,
        padding: "8px 0",
        fontWeight: 400,
        color: "var(--muted)",
        fontSize: 12
      }}
    >
      {children}
    </th>
  );
}
