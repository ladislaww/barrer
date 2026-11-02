"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type DiscountEntry = {
  id: string;
  percentage: number;
  startsAt: string;
  endsAt: string;
  products: { productId: string }[];
};

type DiscountContextValue = {
  discounts: DiscountEntry[];
  getDiscountPct: (productId: string) => number;
  discountedPrice: (price: number, productId: string) => number;
};

const DiscountContext = createContext<DiscountContextValue>({
  discounts: [],
  getDiscountPct: () => 0,
  discountedPrice: (price) => price
});

export function DiscountProvider({ children }: { children: React.ReactNode }) {
  const [discounts, setDiscounts] = useState<DiscountEntry[]>([]);

  useEffect(() => {
    fetch("/api/account/discounts")
      .then((r) => r.json())
      .then((data) => setDiscounts(data.discounts ?? []))
      .catch(() => {});
  }, []);

  const getDiscountPct = useCallback(
    (productId: string) => {
      let best = 0;
      for (const d of discounts) {
        if (d.products.some((p) => p.productId === productId)) {
          best = Math.max(best, d.percentage);
        }
      }
      return best;
    },
    [discounts]
  );

  const discountedPrice = useCallback(
    (price: number, productId: string) => {
      const pct = getDiscountPct(productId);
      return pct > 0 ? Math.round(price * (1 - pct / 100) * 100) / 100 : price;
    },
    [getDiscountPct]
  );

  return (
    <DiscountContext.Provider value={{ discounts, getDiscountPct, discountedPrice }}>
      {children}
    </DiscountContext.Provider>
  );
}

export function useDiscounts() {
  return useContext(DiscountContext);
}
