import { prisma } from "./prisma";
import type { Product } from "./types";
import type { Product as DbProduct } from "@prisma/client";

function parseList(value: string): string[] {
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function normalize(raw: DbProduct): Product {
  return {
    ...raw,
    details: parseList(raw.details),
    detailsEn: parseList(raw.detailsEn),
    images: parseList(raw.images)
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(normalize);
}

export async function getVisibleProducts(): Promise<Product[]> {
  const rows = await prisma.product.findMany({
    where: { isVisible: true },
    orderBy: { createdAt: "desc" }
  });
  return rows.map(normalize);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!slug) return null;
  const row = await prisma.product.findFirst({ where: { slug, isVisible: true } });
  return row ? normalize(row) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const row = await prisma.product.findUnique({ where: { id } });
  return row ? normalize(row) : null;
}

export async function getProductStocks(productIds: string[]): Promise<Record<string, number>> {
  if (productIds.length === 0) return {};
  const rows = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true, stock: true }
  });
  return Object.fromEntries(rows.map((p) => [p.id, p.stock]));
}

export async function getAvailableProducts(productIds: string[]): Promise<Record<string, Product>> {
  if (productIds.length === 0) return {};
  const rows = await prisma.product.findMany({
    where: { id: { in: productIds }, isVisible: true, inStock: true }
  });
  return Object.fromEntries(rows.map((product) => [product.id, normalize(product)]));
}

export async function decrementProductStock(productId: string, quantity: number): Promise<void> {
  if (quantity <= 0) return;
  await prisma.product.update({
    where: { id: productId },
    data: { stock: { decrement: quantity } }
  });
  const product = await prisma.product.findUnique({ where: { id: productId }, select: { stock: true } });
  if (product && product.stock <= 0) {
    await prisma.product.update({ where: { id: productId }, data: { inStock: false, stock: 0 } });
  }
}

type ProductInput = Omit<Product, "id" | "createdAt" | "updatedAt">;

export async function createProduct(data: ProductInput): Promise<Product> {
  const row = await prisma.product.create({
    data: {
      ...data,
      details: JSON.stringify(data.details),
      detailsEn: JSON.stringify(data.detailsEn),
      images: JSON.stringify(data.images)
    }
  });
  return normalize(row);
}

export async function updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
  const row = await prisma.product.update({
    where: { id },
    data: {
      ...data,
      details: data.details !== undefined ? JSON.stringify(data.details) : undefined,
      detailsEn: data.detailsEn !== undefined ? JSON.stringify(data.detailsEn) : undefined,
      images: data.images !== undefined ? JSON.stringify(data.images) : undefined
    }
  });
  return normalize(row);
}

export async function deleteProduct(id: string): Promise<void> {
  await prisma.product.delete({ where: { id } });
}
