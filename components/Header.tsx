import Link from "next/link";
import { CartIndicator } from "./CartIndicator";

export function Header() {
  return (
    <header className="page">
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/" style={{ fontSize: 20, letterSpacing: "0.35em" }}>
          BARRER
        </Link>
        <nav style={{ marginLeft: "auto", display: "flex", gap: 24 }} className="mono">
          <Link href="/#catalog" className="nav-link">
            Catalog
          </Link>
          <Link href="/about" className="nav-link">
            About
          </Link>
        </nav>
        <CartIndicator />
      </div>
      <div className="divider" />
    </header>
  );
}
