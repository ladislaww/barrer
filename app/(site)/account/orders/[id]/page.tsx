import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { getUserOrderById } from "@/lib/db/orders";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { ORDER_STATUS_META } from "@/lib/orders/status";
import { getOrderTotals } from "@/lib/orders/totals";
import { formatMoneyRub, type Locale } from "@/lib/i18n";

type Props = { params: Promise<{ id: string }> };

export const metadata = { title: "Заказ — Barrer" };

// Статус заказа меняет администратор, поэтому страница всегда рендерится заново.
export const dynamic = "force-dynamic";

export default async function AccountOrderPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/login");

  const { id } = await params;
  const order = await getUserOrderById(session.user.id, id);
  if (!order) notFound();

  const totals = getOrderTotals(order);
  const locale: Locale = order.currency === "USD" ? "en" : "ru";
  const money = (value: number) => formatMoneyRub(value, locale);
  const address = [order.street, order.house, order.building, order.city, order.postal]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="page">
      <div className="container" style={{ display: "grid", gap: 24, maxWidth: 900 }}>
        <div>
          <Link href="/account" className="nav-link">← В личный кабинет</Link>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div>
            <div className="mono">Order #{order.id.slice(-8)}</div>
            <h1 style={{ fontSize: 32, margin: "12px 0 4px" }}>Заказ от {new Date(order.createdAt).toLocaleDateString("ru-RU")}</h1>
            <div className="muted">{new Date(order.createdAt).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}</div>
          </div>
          <div style={{ display: "grid", gap: 6, justifyItems: "end" }}>
            <OrderStatusBadge status={order.status} />
            <span className="muted" style={{ fontSize: 13, textAlign: "right" }}>
              {ORDER_STATUS_META[order.status].hint}
            </span>
          </div>
        </div>

        <section className="card" style={{ gap: 16 }}>
          <div className="mono">Позиции заказа · {totals.quantity} шт.</div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 14 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <Th>Товар</Th>
                  <Th align="right">Кол-во</Th>
                  <Th align="right">Цена за шт.</Th>
                  <Th align="right">Цена со скидкой</Th>
                  <Th align="right">Сумма</Th>
                  <Th align="right">Сумма со скидкой</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const discounted = item.unitPriceDiscounted < item.unitPrice;
                  return (
                    <tr key={item.id} style={{ borderBottom: "1px solid var(--border)" }}>
                      <Td>
                        <Link href={`/products/${item.product.slug}`} style={{ color: "var(--text)" }}>
                          {item.product.title}
                        </Link>
                      </Td>
                      <Td align="right">{item.quantity}</Td>
                      <Td align="right">
                        <span className={discounted ? "muted" : undefined} style={discounted ? { textDecoration: "line-through" } : undefined}>
                          {money(item.unitPrice)}
                        </span>
                      </Td>
                      <Td align="right">{money(item.unitPriceDiscounted)}</Td>
                      <Td align="right">
                        <span className={discounted ? "muted" : undefined} style={discounted ? { textDecoration: "line-through" } : undefined}>
                          {money(item.lineTotal)}
                        </span>
                      </Td>
                      <Td align="right">{money(item.lineTotalDiscounted)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gap: 8, justifyItems: "end", paddingTop: 8 }}>
            <TotalRow label="Сумма без скидки" value={money(totals.subtotal)} />
            <TotalRow
              label="Скидка"
              value={totals.discount > 0 ? `−${money(totals.discount)} (${totals.discountPct}%)` : "—"}
            />
            <TotalRow label="Итого" value={money(totals.total)} emphasis />
          </div>
        </section>

        <section className="card" style={{ gap: 10 }}>
          <div className="mono">Доставка</div>
          <Row label="Получатель" value={order.customerName || "—"} />
          <Row label="Телефон" value={order.customerPhone} />
          <Row label="Email" value={order.customerEmail} />
          {address && <Row label="Адрес" value={address} />}
          {order.comment && <Row label="Комментарий" value={order.comment} />}
        </section>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", gap: 16, fontSize: 14 }}>
      <span className="muted" style={{ minWidth: 110 }}>{label}</span>
      <span>{value}</span>
    </div>
  );
}

function TotalRow({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 24, alignItems: "baseline" }}>
      <span className="muted" style={{ fontSize: 13 }}>{label}</span>
      <span style={{ fontSize: emphasis ? 22 : 14, minWidth: 140, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className="muted"
      style={{ textAlign: align, padding: "0 0 8px", paddingLeft: align === "right" ? 16 : 0, fontWeight: 400, fontSize: 12 }}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <td style={{ padding: "10px 0", paddingLeft: align === "right" ? 16 : 0, textAlign: align }}>{children}</td>
  );
}
