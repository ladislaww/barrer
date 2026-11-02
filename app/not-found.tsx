import Link from "next/link";

/**
 * 404 для адресов, не попавших ни в один маршрут. Страницы витрины
 * используют `app/(site)/not-found.tsx` — там есть шапка и подвал.
 */

export const metadata = { title: "Страница не найдена — Barrer" };

export default function RootNotFound() {
  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 560, display: "grid", gap: 20 }}>
        <Link href="/" style={{ fontSize: 20, letterSpacing: "0.35em" }}>
          BARRER
        </Link>
        <div className="divider" />
        <div className="mono">404</div>
        <h1 style={{ fontSize: 36, margin: 0 }}>Страница не найдена</h1>
        <p className="muted" style={{ margin: 0 }}>
          Возможно, ссылка устарела или была набрана с ошибкой.
        </p>
        <div>
          <Link href="/" className="btn" style={{ textDecoration: "none" }}>
            В каталог
          </Link>
        </div>
      </div>
    </div>
  );
}
