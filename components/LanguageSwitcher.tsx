"use client";

import { useLanguage } from "./LanguageContext";

export function LanguageSwitcher() {
  const { locale, setLocale } = useLanguage();

  return (
    <div
      className="mono"
      style={{
        display: "inline-flex",
        border: "1px solid var(--border)",
        alignItems: "center"
      }}
      aria-label="Language switcher"
    >
      {(["ru", "en"] as const).map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => setLocale(item)}
          style={{
            border: 0,
            background: locale === item ? "var(--text)" : "transparent",
            color: locale === item ? "var(--bg)" : "var(--muted)",
            padding: "6px 8px",
            cursor: "pointer",
            font: "inherit"
          }}
        >
          {item.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
