import Link from "next/link";
import { getOrderStats, listOrders } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getOrderTotals } from "@/lib/orders/totals";

const formatRub = (value: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);

export default async function AdminDashboard() {
  const [stats, recentOrders] = await Promise.all([
    getOrderStats(),
    listOrders().then((orders) => orders.slice(0, 8))
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, marginBottom: 8 }}>OVERVIEW</div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Dashboard</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16 }}>
        <StatCard label="Всего заказов" value={stats.totalOrders} />
        <StatCard label="Выручка (без возвратов)" value={formatRub(stats.revenue)} />
        <StatCard label="Ожидают доставки" value={stats.awaitingDelivery} />
        <StatCard label="Возвраты" value={stats.returnedOrders} />
        <StatCard label="Товаров" value={stats.totalProducts} />
      </div>

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div className="mono" style={{ fontSize: 11 }}>RECENT ORDERS</div>
          <Link href="/admin/orders" style={{ fontSize: 13, color: "var(--muted)" }}>
            View all →
          </Link>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <Th>ID</Th>
              <Th>Дата</Th>
              <Th>Покупатель</Th>
              <Th>Позиций</Th>
              <Th>Сумма</Th>
              <Th>Статус</Th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => {
              const totals = getOrderTotals(order);
              return (
                <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <Td>
                    <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--text)", fontFamily: "monospace", fontSize: 12 }}>
                      {order.id.slice(-8)}
                    </Link>
                  </Td>
                  <Td>{new Date(order.createdAt).toLocaleDateString("ru-RU")}</Td>
                  <Td>{order.customerEmail}</Td>
                  <Td>{order.items.length}</Td>
                  <Td>{formatRub(totals.total)}</Td>
                  <Td><OrderStatusBadge status={order.status} size="sm" /></Td>
                </tr>
              );
            })}
            {recentOrders.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: "24px 0", color: "var(--muted)", textAlign: "center" }}>
                  No orders yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="card" style={{ gap: 8 }}>
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>
      {children}
    </th>
  );
}

function Td({ children }: { children: React.ReactNode }) {
  return <td style={{ padding: "12px 0" }}>{children}</td>;
}
