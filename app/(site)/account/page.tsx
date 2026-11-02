import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { getUserById } from "@/lib/db/users";
import { listOrdersByUser } from "@/lib/db/orders";
import { AccountProfileForm } from "@/components/AccountProfileForm";
import { MembersCard } from "@/components/MembersCard";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { getOrderTotals } from "@/lib/orders/totals";
import { formatMoneyRub } from "@/lib/i18n";

export const metadata = { title: "Личный кабинет — Barrer" };

// Статус заказа меняет администратор, поэтому страница всегда рендерится заново.
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/account/login");

  const [user, orders] = await Promise.all([
    getUserById(session.user.id),
    listOrdersByUser(session.user.id)
  ]);

  if (!user) redirect("/account/login");

  return (
    <div className="page">
      <div className="container" style={{ display: "grid", gap: 32 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
          <div>
            <div className="mono">Account</div>
            <h1 style={{ fontSize: 36, margin: "12px 0 0" }}>Личный кабинет</h1>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <button className="btn secondary" type="submit">Выйти</button>
          </form>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "minmax(280px, 420px) 1fr", gap: 24, alignItems: "start" }}>
          <div style={{ display: "grid", gap: 24 }}>
            <MembersCard userName={user.name} />
            <AccountProfileForm user={user} />
          </div>

          <section className="card">
            <div className="mono">My orders</div>
            {orders.length === 0 ? (
              <p className="muted" style={{ margin: 0 }}>Заказов пока нет.</p>
            ) : (
              <div style={{ display: "grid", gap: 20 }}>
                {orders.map((order) => {
                  const totals = getOrderTotals(order);
                  const locale = order.currency === "USD" ? "en" : "ru";

                  return (
                    <article key={order.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: 20 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start" }}>
                        <div>
                          <div className="mono">#{order.id.slice(-8)}</div>
                          <div className="muted">{new Date(order.createdAt).toLocaleString("ru-RU")}</div>
                        </div>
                        <OrderStatusBadge status={order.status} />
                      </div>

                      <ul style={{ color: "var(--muted)", paddingLeft: 18, margin: "12px 0" }}>
                        {order.items.map((item) => (
                          <li key={item.id}>
                            {item.product.title} × {item.quantity} — {formatMoneyRub(item.lineTotalDiscounted, locale)}
                          </li>
                        ))}
                      </ul>

                      <div style={{ display: "grid", gap: 2 }}>
                        {totals.discount > 0 && (
                          <>
                            <div className="muted" style={{ fontSize: 14, textDecoration: "line-through" }}>
                              {formatMoneyRub(totals.subtotal, locale)}
                            </div>
                            <div className="muted" style={{ fontSize: 13 }}>
                              Скидка: −{formatMoneyRub(totals.discount, locale)} ({totals.discountPct}%)
                            </div>
                          </>
                        )}
                        <div style={{ fontSize: 18 }}>{formatMoneyRub(totals.total, locale)}</div>
                      </div>

                      <div className="muted" style={{ marginTop: 8, fontSize: 13 }}>
                        {order.customerPhone} · {[order.city, order.street, order.house, order.building, order.postal].filter(Boolean).join(", ")}
                      </div>

                      <Link href={`/account/orders/${order.id}`} className="nav-link" style={{ display: "inline-block", marginTop: 12 }}>
                        Подробнее о заказе →
                      </Link>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
