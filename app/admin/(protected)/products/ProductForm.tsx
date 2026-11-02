"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/db/types";

type FormData = {
  title: string;
  titleEn: string;
  slug: string;
  price: string;
  stock: string;
  inStock: boolean;
  isVisible: boolean;
  description: string;
  descriptionEn: string;
  details: string[];
  detailsEn: string[];
  images: string[];
};

function toSlug(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function ProductForm({ product }: { product?: Product }) {
  const router = useRouter();
  const isEdit = Boolean(product);

  const [form, setForm] = useState<FormData>({
    title: product?.title ?? "",
    titleEn: product?.titleEn ?? "",
    slug: product?.slug ?? "",
    price: product?.price?.toString() ?? "",
    stock: product?.stock?.toString() ?? "0",
    inStock: product?.inStock ?? true,
    isVisible: product?.isVisible ?? true,
    description: product?.description ?? "",
    descriptionEn: product?.descriptionEn ?? "",
    details: product?.details ?? [""],
    detailsEn: product?.detailsEn ?? [""],
    images: product?.images ?? [""]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleTitleChange(title: string) {
    setForm((f) => ({
      ...f,
      title,
      slug: f.slug === toSlug(f.title) || !f.slug ? toSlug(title) : f.slug
    }));
  }

  function updateList(field: "details" | "detailsEn" | "images", index: number, value: string) {
    setForm((f) => {
      const arr = [...f[field]];
      arr[index] = value;
      return { ...f, [field]: arr };
    });
  }

  function addToList(field: "details" | "detailsEn" | "images") {
    setForm((f) => ({ ...f, [field]: [...f[field], ""] }));
  }

  function removeFromList(field: "details" | "detailsEn" | "images", index: number) {
    setForm((f) => ({ ...f, [field]: f[field].filter((_, i) => i !== index) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const payload = {
      title: form.title,
      titleEn: form.titleEn || undefined,
      slug: form.slug,
      price: parseFloat(form.price),
      stock: parseInt(form.stock, 10),
      inStock: form.inStock,
      isVisible: form.isVisible,
      description: form.description,
      descriptionEn: form.descriptionEn || undefined,
      details: form.details.filter(Boolean),
      detailsEn: form.detailsEn.filter(Boolean),
      images: form.images.filter(Boolean)
    };

    const url = isEdit ? `/api/admin/products/${product!.id}` : "/api/admin/products";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Error saving product");
      setSaving(false);
      return;
    }

    router.push("/admin/products");
    router.refresh();
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${product.id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 640 }}>
      {error && <p style={{ color: "var(--muted)", margin: 0 }}>{error}</p>}

      <Field label="Title">
        <input
          value={form.title}
          onChange={(e) => handleTitleChange(e.target.value)}
          required
        />
      </Field>

      <Field label="Title EN">
        <input
          value={form.titleEn}
          onChange={(e) => setForm((f) => ({ ...f, titleEn: e.target.value }))}
          placeholder="English title"
        />
      </Field>

      <Field label="Slug">
        <input
          value={form.slug}
          onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
          required
          style={{ fontFamily: "monospace" }}
        />
      </Field>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Field label="Price (RUB)">
          <input
            type="number"
            step="0.01"
            min="0"
            value={form.price}
            onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
            required
          />
        </Field>
        <Field label="Stock">
          <input
            type="number"
            min="0"
            value={form.stock}
            onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))}
            required
          />
        </Field>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          id="inStock"
          type="checkbox"
          checked={form.inStock}
          onChange={(e) => setForm((f) => ({ ...f, inStock: e.target.checked }))}
          style={{ width: "auto" }}
        />
        <label htmlFor="inStock" style={{ fontSize: 14 }}>In stock</label>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input
          id="isVisible"
          type="checkbox"
          checked={form.isVisible}
          onChange={(e) => setForm((f) => ({ ...f, isVisible: e.target.checked }))}
          style={{ width: "auto" }}
        />
        <label htmlFor="isVisible" style={{ fontSize: 14 }}>Показывать на сайте</label>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          rows={4}
          required
          style={{ resize: "vertical" }}
        />
      </Field>

      <Field label="Description EN">
        <textarea
          value={form.descriptionEn}
          onChange={(e) => setForm((f) => ({ ...f, descriptionEn: e.target.value }))}
          rows={4}
          style={{ resize: "vertical" }}
        />
      </Field>

      <div>
        <div style={{ fontSize: 13, marginBottom: 10 }}>Details</div>
        {form.details.map((detail, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={detail}
              onChange={(e) => updateList("details", i, e.target.value)}
              placeholder="e.g. Italian wool blend"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeFromList("details", i)}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "0 10px", cursor: "pointer", flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList("details")}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
        >
          + Add detail
        </button>
      </div>

      <div>
        <div style={{ fontSize: 13, marginBottom: 10 }}>Details EN</div>
        {form.detailsEn.map((detail, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={detail}
              onChange={(e) => updateList("detailsEn", i, e.target.value)}
              placeholder="e.g. Italian wool blend"
              style={{ flex: 1 }}
            />
            <button
              type="button"
              onClick={() => removeFromList("detailsEn", i)}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "0 10px", cursor: "pointer", flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList("detailsEn")}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
        >
          + Add EN detail
        </button>
      </div>

      <div>
        <div style={{ fontSize: 13, marginBottom: 10 }}>Images (URLs)</div>
        {form.images.map((img, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
            <input
              value={img}
              onChange={(e) => updateList("images", i, e.target.value)}
              placeholder="https://images.unsplash.com/..."
              style={{ flex: 1, fontFamily: "monospace", fontSize: 12 }}
            />
            <button
              type="button"
              onClick={() => removeFromList("images", i)}
              style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "0 10px", cursor: "pointer", flexShrink: 0 }}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => addToList("images")}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "6px 14px", cursor: "pointer", fontSize: 13 }}
        >
          + Add image URL
        </button>
      </div>

      <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving..." : isEdit ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/products")}
          style={{ background: "none", border: "1px solid var(--border)", color: "var(--muted)", padding: "10px 20px", cursor: "pointer" }}
        >
          Cancel
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            style={{ background: "none", border: "1px solid #f44336", color: "#f44336", padding: "10px 20px", cursor: "pointer", marginLeft: "auto" }}
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ fontSize: 13, display: "block", marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}
