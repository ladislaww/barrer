"use client";

import Link from "next/link";
import { useCart } from "./CartContext";
import { useLanguage } from "./LanguageContext";

export function CartIndicator() {
  const { totalItems } = useCart();
  const { t } = useLanguage();

  return (
    <Link href="/cart" className="mono nav-link">
      {t.cart} [{totalItems}]
    </Link>
  );
}
