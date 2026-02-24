"use client";

import Link from "next/link";
import { useCart } from "./CartContext";

export function CartIndicator() {
  const { totalItems } = useCart();

  return (
    <Link href="/cart" className="mono nav-link">
      Cart [{totalItems}]
    </Link>
  );
}
