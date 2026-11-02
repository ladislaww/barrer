import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderById } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getOrderTotals } from "@/lib/orders/totals";
import { OrderStatusForm } from "./OrderStatusForm";

type Props = { params: Promise<{ id: string }> };

const formatRub = (value: number) =>
  new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(value);

export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  const totals = getOrderTotals(order);
  const address = [order.street, order.house, order.building, order.city, order.postal]
    .filter(Boolean)
    .join(", ");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32, maxWidth: 900 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div>
          <Link href="/admin/orders" style={{ fontSize: 13, color: "var(--muted)" }}>
            ← Заказы
          </Link>
          <h1 style={{ fontSize: 24, margin: "8px 0 4px" }}>
            Заказ <span style={{ fontFamily: "monospace" }}>{order.id.slice(-8)}</span>
          </h1>
          <div style={{ fontSize: 13, color: "var(--muted)" }}>
            {new Date(order.createdAt).toLocaleString("ru-RU")}
          </div>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="card" style={{ gap: 12 }}>
        <div className="mono" style={{ fontSize: 11 }}>ПОКУПАТЕЛЬ</div>
        <Row label="Email" value={order.customerEmail} />
        <Row label="Телефон" value={order.customerPhone} />
        {order.customerName && <Row label="Имя" value={order.customerName} />}
        {address && <Row label="Адрес" value={address} />}
        {order.comment && <Row label="Комментарий" value={order.comment} />}
        <Row label="Валюта" value={`${order.currency} / курс ${order.exchangeRate}`} />
      </div>

      <div className="card" style={{ gap: 16 }}>
        <div className="mono" style={{ fontSize: 11 }}>
          ПОЗИЦИИ ЗАКАЗА · {order.items.length} шт. наименований / {totals.quantity} ед. товара
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 640, borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <ItemTh>Товар</ItemTh>
                <ItemTh align="right">Кол-во</ItemTh>
                <ItemTh align="right">Цена за ед. без скидки</ItemTh>
                <ItemTh align="right">Цена за ед. со скидкой</ItemTh>
                <ItemTh align="right">Сумма без скидки</ItemTh>
                <ItemTh align="right">Сумма со скидкой</ItemTh>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => {
                const discounted = item.unitPriceDiscounted < item.unitPrice;
                return (
                  <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <ItemTd>
                      <Link href={`/admin/products/${item.productId}`} style={{ color: "var(--text)" }}>
                        {item.product.title}
                      </Link>
                    </ItemTd>
                    <ItemTd align="right">{item.quantity}</ItemTd>
                    <ItemTd align="right">{formatRub(item.unitPrice)}</ItemTd>
                    <ItemTd align="right">
                      <span style={{ color: discounted ? "var(--text)" : "var(--muted)" }}>
                        {formatRub(item.unitPriceDiscounted)}
                      </span>
                    </ItemTd>
                    <ItemTd align="right">{formatRub(item.lineTotal)}</ItemTd>
                    <ItemTd align="right">{formatRub(item.lineTotalDiscounted)}</ItemTd>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ display: "grid", gap: 8, justifyItems: "end", paddingTop: 8 }}>
          <TotalRow label="Сумма без скидки" value={formatRub(totals.subtotal)} />
          <TotalRow
            label="Скидка"
            value={totals.discount > 0 ? `−${formatRub(totals.discount)} (${totals.discountPct}%)` : "—"}
          />
          <TotalRow label="Итого к оплате" value={formatRub(totals.total)} emphasis />
        </div>
      </div>

      <div className="card" style={{ gap: 16 }}>
        <div className="mono" style={{ fontSize: 11 }}>СТАТУС ЗАКАЗА</div>
        <OrderStatusForm orderId={order.id} currentStatus={order.status} />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
      <span style={{ color: "var(--muted)", minWidth: 110 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
      <span style={{ color: "var(--muted)", fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: emphasis ? 20 : 14, minWidth: 140, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function ItemTh({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th style={{ textAlign: align, padding: "0 0 8px", paddingLeft: align === "right" ? 16 : 0, fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>
      {children}
    </th>
  );
}

function ItemTd({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td style={{ padding: "10px 0", paddingLeft: align === "right" ? 16 : 0, textAlign: align }}>{children}</td>
  );
}
