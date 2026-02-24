"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/lib/cms/types";
import { AddToCartButton } from "./AddToCartButton";

export function ProductCard({ product }: { product: Product }) {
  return (
    <div className="card">
      {product.images.length > 0 ? (
        <div
          style={{
            overflowX: "auto",
            scrollSnapType: "x mandatory",
            scrollbarWidth: "thin"
          }}
        >
          <div style={{ display: "flex" }}>
            {product.images.map((src, index) => (
              <div
                key={`${product.id}-${index}`}
                style={{
                  flex: "0 0 100%",
                  scrollSnapAlign: "start"
                }}
              >
                <Image
                  src={src}
                  alt={`${product.title} ${index + 1}`}
                  width={640}
                  height={800}
                  style={{ width: "100%", height: "auto", border: "1px solid var(--border)" }}
                />
              </div>
            ))}
          </div>
        </div>
      ) : null}
      <div
        className="mono"
        style={{
          color: product.inStock ? "var(--text)" : "var(--muted)"
        }}
      >
        {product.inStock ? "In stock" : "Sold out"}
      </div>
      <div className="mono">Edition {product.id}</div>
      <Link href={`/products/${product.slug}`}>
        <h3 style={{ margin: 0, fontSize: 22 }}>{product.title}</h3>
      </Link>
      <p className="muted" style={{ margin: 0 }}>
        {product.description}
      </p>
      <div style={{ fontSize: 18 }}>€ {product.price}</div>
      {product.inStock ? <AddToCartButton product={product} /> : null}
    </div>
  );
}
