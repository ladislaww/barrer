"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { ProductImage } from "./ProductImage";

type ProductGalleryProps = {
  title: string;
  images: string[];
};

export function ProductGallery({ title, images }: ProductGalleryProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasImages = images.length > 0;

  const activeImage = useMemo(() => {
    if (activeIndex === null) {
      return null;
    }
    return images[activeIndex] ?? null;
  }, [activeIndex, images]);

  const goNext = () => {
    setActiveIndex((prev) => (prev === null ? 0 : (prev + 1) % images.length));
  };

  const goPrev = () => {
    setActiveIndex((prev) =>
      prev === null ? 0 : (prev - 1 + images.length) % images.length
    );
  };

  useEffect(() => {
    if (activeIndex === null) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setActiveIndex(null);
        return;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeIndex, images.length]);

  const handleClose = () => setActiveIndex(null);

  return (
    <>
      <div className="grid" style={{ gap: 16 }}>
        <button
          type="button"
          onClick={() => (hasImages ? setActiveIndex(0) : undefined)}
          style={{ padding: 0, border: "none", background: "transparent", cursor: hasImages ? "zoom-in" : "default" }}
          aria-label="Enlarge image"
        >
          <ProductImage
            src={images[0]}
            alt={title}
            width={900}
            height={1200}
            style={{ width: "100%", height: "auto", border: "1px solid var(--border)" }}
          />
        </button>
        {images.length > 1 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 12
            }}
          >
            {images.slice(1).map((src, index) => (
              <button
                key={src}
                type="button"
                onClick={() => setActiveIndex(index + 1)}
                style={{
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "zoom-in"
                }}
                aria-label={`Enlarge image ${index + 2}`}
              >
                <Image
                  src={src}
                  alt={`${title} ${index + 2}`}
                  width={420}
                  height={560}
                  style={{ width: "100%", height: "auto", border: "1px solid var(--border)" }}
                />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {activeImage ? (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(5, 5, 5, 0.92)",
            display: "grid",
            placeItems: "center",
            zIndex: 50,
            padding: "40px 6vw"
          }}
        >
          <div
            style={{
              position: "relative",
              width: "min(1100px, 100%)",
              maxHeight: "90vh"
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeImage}
              alt={`${title} ${(activeIndex ?? 0) + 1}`}
              width={1200}
              height={1600}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: "90vh",
                objectFit: "contain",
                cursor: images.length > 1 ? "pointer" : "default"
              }}
              onClick={(event) => {
                if (images.length <= 1) {
                  return;
                }
                const bounds = event.currentTarget.getBoundingClientRect();
                const clickX = event.clientX - bounds.left;
                if (clickX < bounds.width / 2) {
                  goPrev();
                } else {
                  goNext();
                }
              }}
            />
          </div>
        </div>
      ) : null}
    </>
  );
}
