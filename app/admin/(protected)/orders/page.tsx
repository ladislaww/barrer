import Link from "next/link";
import { countOrdersByStatus, listOrders, parseOrderQuery, type OrderQuery, type OrderSortKey } from "@/lib/db/orders";
import { ORDER_STATUSES, ORDER_STATUS_META } from "@/lib/orders/status";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getOrderTotals } from "@/lib/orders/totals";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

const formatRub = (value: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(value);

function toParams(search: Record<string, string | string[] | undefined>): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(search)) {
    if (typeof value === "string") params.set(key, value);
  }
  return params;
}

/** Ссылка, сохраняющая текущие параметры и меняющая только переданные. */
function hrefWith(query: OrderQuery, patch: Partial<OrderQuery>): string {
  const next = { ...query, ...patch };
  const params = new URLSearchParams();
  if (next.status !== "ALL") params.set("status", next.status);
  if (next.sort !== "createdAt") params.set("sort", next.sort);
  if (next.dir !== "desc") params.set("dir", next.dir);
  const qs = params.toString();
  return qs ? `/admin/orders?${qs}` : "/admin/orders";
}

export default async function AdminOrdersPage({ searchParams }: Props) {
  const query = parseOrderQuery(toParams(await searchParams));
  const [orders, counts] = await Promise.all([listOrders(query), countOrdersByStatus()]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, marginBottom: 8 }}>ORDERS</div>
        <h1 style={{ fontSize: 28, margin: 0 }}>Заказы ({orders.length})</h1>
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: 12, color: "var(--muted)", marginRight: 4 }}>Статус:</span>
        <FilterChip
          href={hrefWith(query, { status: "ALL" })}
          label={`Все · ${counts.ALL}`}
          active={query.status === "ALL"}
        />
        {ORDER_STATUSES.map((status) => (
          <FilterChip
            key={status}
            href={hrefWith(query, { status })}
            label={`${ORDER_STATUS_META[status].ru} · ${counts[status]}`}
            active={query.status === status}
            color={ORDER_STATUS_META[status].color}
          />
        ))}
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <SortableTh query={query} sortKey="createdAt">Дата</SortableTh>
            <Th>ID</Th>
            <SortableTh query={query} sortKey="customerEmail">Покупатель</SortableTh>
            <Th>Телефон</Th>
            <Th>Позиций</Th>
            <Th align="right">Без скидки</Th>
            <Th align="right">Скидка</Th>
            <SortableTh query={query} sortKey="totalRub" align="right">К оплате</SortableTh>
            <SortableTh query={query} sortKey="status">Статус</SortableTh>
            <Th />
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => {
            const totals = getOrderTotals(order);
            return (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--border)" }}>
                <Td>{new Date(order.createdAt).toLocaleDateString("ru-RU")}</Td>
                <Td>
                  <span style={{ fontFamily: "monospace", fontSize: 12 }}>{order.id.slice(-8)}</span>
                </Td>
                <Td>{order.customerEmail}</Td>
                <Td>{order.customerPhone}</Td>
                <Td>
                  {order.items.length}
                  <span style={{ color: "var(--muted)" }}> / {totals.quantity} шт</span>
                </Td>
                <Td align="right">{formatRub(totals.subtotal)}</Td>
                <Td align="right">
                  {totals.discount > 0 ? (
                    <span>−{formatRub(totals.discount)}</span>
                  ) : (
                    <span style={{ color: "var(--muted)" }}>—</span>
                  )}
                </Td>
                <Td align="right">{formatRub(totals.total)}</Td>
                <Td><OrderStatusBadge status={order.status} size="sm" /></Td>
                <Td>
                  <Link href={`/admin/orders/${order.id}`} style={{ color: "var(--muted)", fontSize: 13 }}>
                    View →
                  </Link>
                </Td>
              </tr>
            );
          })}
          {orders.length === 0 && (
            <tr>
              <td colSpan={10} style={{ padding: "40px 0", color: "var(--muted)", textAlign: "center" }}>
                {counts.ALL === 0 ? "Заказов пока нет" : "Нет заказов с выбранным статусом"}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function FilterChip({
  href,
  label,
  active,
  color
}: {
  href: string;
  label: string;
  active: boolean;
  color?: string;
}) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 12,
        padding: "4px 12px",
        borderRadius: 999,
        textDecoration: "none",
        border: `1px solid ${active ? color ?? "var(--text)" : "var(--border)"}`,
        background: active ? color ?? "var(--text)" : "transparent",
        color: active ? "var(--bg)" : "var(--muted)"
      }}
    >
      {label}
    </Link>
  );
}

function SortableTh({
  query,
  sortKey,
  align = "left",
  children
}: {
  query: OrderQuery;
  sortKey: OrderSortKey;
  align?: "left" | "right";
  children: React.ReactNode;
}) {
  const active = query.sort === sortKey;
  // Клик по активной колонке переворачивает направление, по новой — начинает с убывания.
  const nextDir = active && query.dir === "desc" ? "asc" : "desc";

  return (
    <Th align={align}>
      <Link
        href={hrefWith(query, { sort: sortKey, dir: nextDir })}
        style={{ color: active ? "var(--text)" : "var(--muted)", textDecoration: "none" }}
      >
        {children}
        <span style={{ opacity: active ? 1 : 0.3 }}> {active && query.dir === "asc" ? "↑" : "↓"}</span>
      </Link>
    </Th>
  );
}

function Th({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ textAlign: align, padding: "8px 0", fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children?: React.ReactNode; align?: "left" | "right" }) {
  return <td style={{ padding: "12px 0", paddingRight: 16, textAlign: align }}>{children}</td>;
}
