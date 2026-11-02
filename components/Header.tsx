import Link from "next/link";
import { EN_LOCALE_ENABLED } from "@/lib/i18n";
import { CartIndicator } from "./CartIndicator";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { HeaderNav } from "./HeaderNav";

export function Header() {
  return (
    <header className="page">
      <div className="container" style={{ display: "flex", alignItems: "center", gap: 24 }}>
        <Link href="/" style={{ fontSize: 20, letterSpacing: "0.35em" }}>
          BARRER
        </Link>
        <HeaderNav />
        {EN_LOCALE_ENABLED ? <LanguageSwitcher /> : null}
        <CartIndicator />
      </div>
      <div className="divider" />
    </header>
  );
}
