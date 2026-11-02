import Link from "next/link";
import Image from "next/image";
import { getProducts } from "@/lib/db/products";

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="mono" style={{ fontSize: 11, marginBottom: 8 }}>PRODUCTS</div>
          <h1 style={{ fontSize: 28, margin: 0 }}>All Products ({products.length})</h1>
        </div>
        <Link href="/admin/products/new" className="btn" style={{ textDecoration: "none" }}>
          + Add product
        </Link>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--border)" }}>
            <Th>Image</Th>
            <Th>Title</Th>
            <Th>Price</Th>
            <Th>Stock</Th>
            <Th>In stock</Th>
            <Th>Visible</Th>
            <Th>Slug</Th>
            <Th></Th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} style={{ borderBottom: "1px solid var(--border)" }}>
              <Td>
                {product.images[0] ? (
                  <Image
                    src={product.images[0]}
                    alt={product.title}
                    width={48}
                    height={48}
                    style={{ objectFit: "cover", display: "block" }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, background: "var(--border)" }} />
                )}
              </Td>
              <Td>{product.title}</Td>
              <Td>{product.price} ₽</Td>
              <Td>{product.stock}</Td>
              <Td>
                <span style={{ color: product.inStock ? "#4caf50" : "#888", fontSize: 12 }}>
                  {product.inStock ? "Yes" : "No"}
                </span>
              </Td>
              <Td>
                <span style={{ color: product.isVisible ? "#4caf50" : "#f0ad4e", fontSize: 12 }}>
                  {product.isVisible ? "Shown" : "Hidden"}
                </span>
              </Td>
              <Td>
                <span style={{ fontFamily: "monospace", fontSize: 12, color: "var(--muted)" }}>
                  {product.slug}
                </span>
              </Td>
              <Td>
                <Link href={`/admin/products/${product.id}`} style={{ color: "var(--muted)", fontSize: 13 }}>
                  Edit →
                </Link>
              </Td>
            </tr>
          ))}
          {products.length === 0 && (
            <tr>
              <td colSpan={8} style={{ padding: "40px 0", color: "var(--muted)", textAlign: "center" }}>
                No products yet.{" "}
                <Link href="/admin/products/new" style={{ color: "var(--text)" }}>
                  Add first product →
                </Link>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

function Th({ children }: { children?: React.ReactNode }) {
  return (
    <th style={{ textAlign: "left", padding: "8px 0", fontWeight: 400, color: "var(--muted)", fontSize: 12 }}>
      {children}
    </th>
  );
}

function Td({ children }: { children?: React.ReactNode }) {
  return <td style={{ padding: "12px 0", paddingRight: 16 }}>{children}</td>;
}
