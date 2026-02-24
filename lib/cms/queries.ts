import { products as mockProducts } from "./data";
import { isSanityConfigured, sanityClient } from "./client";
import type { Product } from "./types";

const productProjection = `{
  "id": _id,
  "slug": slug.current,
  title,
  price,
  "inStock": coalesce(inStock, true),
  stock,
  description,
  details,
  "images": images[].asset->url
}`;

export async function getProducts(): Promise<Product[]> {
  if (!isSanityConfigured || !sanityClient) {
    return mockProducts;
  }

  const result = await sanityClient.fetch<Product[]>(
    `*[_type == "product"] | order(_createdAt desc) ${productProjection}`
  );

  return result.map((product) => {
    const stock = product.stock ?? 0;
    const inStock = (product.inStock ?? true) && stock > 0;
    return {
      ...product,
      stock,
      inStock,
      details: product.details ?? [],
      images: product.images ?? []
    };
  });
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) {
    return null;
  }

  if (!isSanityConfigured || !sanityClient) {
    return mockProducts.find((product) => product.slug === slug) ?? null;
  }

  const product = await sanityClient.fetch<Product | null>(
    `*[_type == "product" && slug.current == $slug][0] ${productProjection}`,
    { slug }
  );

  if (!product) {
    return null;
  }

  const stock = product.stock ?? 0;
  const inStock = (product.inStock ?? true) && stock > 0;
  return {
    ...product,
    stock,
    inStock,
    details: product.details ?? [],
    images: product.images ?? []
  };
}
