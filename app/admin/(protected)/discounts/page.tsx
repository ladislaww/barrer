import Link from "next/link";
import { listDiscounts } from "@/lib/db/discounts";

export const metadata = { title: "Скидки — Admin" };

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      style={{
        fontFamily: "monospace",
        fontSize: 11,
        padding: "3px 8px",
        border: "1px solid var(--border)",
        borderRadius: 999,
        color: active ? "var(--text)" : "var(--muted)"
      }}
    >
      {active ? "ACTIVE" : "INACTIVE"}
    </span>
  );
}

export default async function DiscountsPage() {
  const discounts = await listDiscounts();
  const now = new Date();

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Admin</div>
          <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>Скидки Members Card</h1>
        </div>
        <Link href="/admin/discounts/new" className="btn" style={{ fontSize: 13 }}>
          + Новая скидка
        </Link>
      </div>

      {discounts.length === 0 ? (
        <p className="muted">Скидок пока нет.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {["Скидка", "Товары", "Начало", "Конец", "Статус", ""].map((h) => (
                  <th key={h} style={{ padding: "8px 12px", textAlign: "left", fontFamily: "monospace", fontSize: 11, color: "var(--muted)", fontWeight: 400 }}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {discounts.map((d) => {
                const expired = new Date(d.endsAt) < now;
                const pending = new Date(d.startsAt) > now;
                const running = d.isActive && !expired && !pending;
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "12px 12px", fontWeight: 600 }}>−{d.percentage}%</td>
                    <td style={{ padding: "12px 12px", color: "var(--muted)", maxWidth: 240 }}>
                      {d.products.length === 0
                        ? "—"
                        : d.products.map((p) => p.product.title).join(", ")}
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {new Date(d.startsAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 12px", color: "var(--muted)", whiteSpace: "nowrap" }}>
                      {new Date(d.endsAt).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      {expired ? (
                        <span style={{ fontFamily: "monospace", fontSize: 11, color: "var(--muted)" }}>EXPIRED</span>
                      ) : (
                        <StatusBadge active={running} />
                      )}
                    </td>
                    <td style={{ padding: "12px 12px" }}>
                      <Link href={`/admin/discounts/${d.id}`} className="nav-link mono" style={{ fontSize: 12 }}>
                        Изменить
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
