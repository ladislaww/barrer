"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageContext";

export function HeaderNav() {
  const { t } = useLanguage();

  return (
    <nav style={{ marginLeft: "auto", display: "flex", gap: 20, alignItems: "center" }} className="mono">
      <Link href="/#catalog" className="nav-link">
        {t.catalog}
      </Link>
      <Link href="/about" className="nav-link">
        {t.about}
      </Link>
      <Link href="/account" className="nav-link">
        {t.account}
      </Link>
    </nav>
  );
}
