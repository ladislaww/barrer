"use client";

import { useEffect, useState } from "react";
import { useCart } from "./CartContext";
import type { Product } from "@/lib/db/types";
import { useLanguage } from "./LanguageContext";

export function AddToCartButton({ product }: { product: Product }) {
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [isAdded, setIsAdded] = useState(false);

  useEffect(() => {
    if (!isAdded) return;
    const timer = window.setTimeout(() => setIsAdded(false), 1000);
    return () => window.clearTimeout(timer);
  }, [isAdded]);

  return (
    <button
      className="btn"
      data-animate={isAdded ? "added" : undefined}
      onClick={() => {
        addToCart(product);
        setIsAdded(true);
      }}
    >
      {isAdded ? `✓ ${t.added}` : t.addToCart}
    </button>
  );
}
