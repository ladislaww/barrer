import Link from "next/link";

export const metadata = { title: "Страница не найдена — Barrer" };

export default function NotFound() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560, display: "grid", gap: 20 }}>
        <div className="mono">404</div>
        <h1 style={{ fontSize: 36, margin: 0 }}>Страница не найдена</h1>
        <p className="muted" style={{ margin: 0 }}>
          Возможно, товар уже продан или ссылка устарела.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link href="/" className="btn" style={{ textDecoration: "none" }}>
            В каталог
          </Link>
          <Link href="/contacts" className="btn secondary" style={{ textDecoration: "none" }}>
            Связаться с нами
          </Link>
        </div>
      </div>
    </div>
  );
}
