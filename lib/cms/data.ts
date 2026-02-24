import type { Product } from "./types";

export const products: Product[] = [
  {
    id: "p-001",
    slug: "void-sleeve-coat",
    title: "Void Sleeve Coat",
    price: 940,
    inStock: true,
    stock: 5,
    description:
      "Structured wool-blend coat with elongated sleeve geometry. Designed for a low-contrast silhouette.",
    details: ["Italian wool blend", "Hidden placket", "Oversized shoulders", "Unlined"],
    images: [
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "p-002",
    slug: "monolith-cargo-trouser",
    title: "Monolith Cargo Trouser",
    price: 540,
    inStock: false,
    stock: 0,
    description:
      "Wide-leg trouser with utilitarian paneling and deep matte finish. Built for movement.",
    details: ["Japanese twill", "Adjustable hem", "Side volume pockets"],
    images: [
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80"
    ]
  },
  {
    id: "p-003",
    slug: "fog-layer-hoodie",
    title: "Fog Layer Hoodie",
    price: 420,
    inStock: true,
    stock: 3,
    description: "Heavyweight hoodie with distorted seam line and compact hood volume.",
    details: ["Brushed cotton", "Exaggerated cuffs", "Soft wash finish"],
    images: [
      "https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80"
    ]
  }
];
