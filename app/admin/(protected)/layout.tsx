import Link from "next/link";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";

export const metadata = { title: "Admin — Barrer" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/admin/login");
  if (session.user?.role !== "ADMIN") redirect("/");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--bg)" }}>
      <aside
        style={{
          width: 220,
          flexShrink: 0,
          borderRight: "1px solid var(--border)",
          padding: "32px 0",
          display: "flex",
          flexDirection: "column",
          gap: 4
        }}
      >
        <div style={{ padding: "0 24px 24px", borderBottom: "1px solid var(--border)", marginBottom: 8 }}>
          <div className="mono" style={{ fontSize: 11 }}>BARRER</div>
          <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 4 }}>Admin Panel</div>
        </div>

        <NavLink href="/admin">Dashboard</NavLink>
        <NavLink href="/admin/analytics">Аналитика</NavLink>
        <NavLink href="/admin/customers">Покупатели</NavLink>
        <NavLink href="/admin/orders">Orders</NavLink>
        <NavLink href="/admin/products">Products</NavLink>
        <NavLink href="/admin/discounts">Discounts</NavLink>
        <NavLink href="/admin/cards">Members Cards</NavLink>

        <div style={{ marginTop: "auto", padding: "24px 24px 0", borderTop: "1px solid var(--border)" }}>
          <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12, wordBreak: "break-all" }}>
            {session.user?.email}
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/admin/login" });
            }}
          >
            <button
              type="submit"
              style={{
                background: "none",
                border: "1px solid var(--border)",
                color: "var(--muted)",
                padding: "6px 12px",
                cursor: "pointer",
                fontSize: 12,
                width: "100%"
              }}
            >
              Sign out
            </button>
          </form>
        </div>
      </aside>

      <main style={{ flex: 1, padding: 40, overflow: "auto" }}>{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      style={{
        display: "block",
        padding: "10px 24px",
        color: "var(--text)",
        textDecoration: "none",
        fontSize: 14,
        transition: "color 0.15s"
      }}
    >
      {children}
    </Link>
  );
}
