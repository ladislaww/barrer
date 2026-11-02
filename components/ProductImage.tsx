"use client";

import Image from "next/image";
import { useLanguage } from "./LanguageContext";

type ProductImageProps = {
  src?: string | null;
  alt: string;
  width: number;
  height: number;
  className?: string;
  style?: React.CSSProperties;
};

export function ProductImage({ src, alt, width, height, className, style }: ProductImageProps) {
  const { t } = useLanguage();

  if (!src) {
    return (
      <div
        className={className}
        style={{
          width,
          aspectRatio: `${width} / ${height}`,
          maxWidth: "100%",
          border: "1px solid var(--border)",
          display: "grid",
          placeItems: "center",
          color: "var(--muted)",
          background:
            "repeating-linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.03) 8px, transparent 8px, transparent 16px)",
          ...style
        }}
      >
        <span className="mono">{t.fallbackImage}</span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
}
