"use client";

import { useLanguage } from "./LanguageContext";

export function HomeIntro() {
  const { locale } = useLanguage();

  return (
    <>
      <section className="container" style={{ marginBottom: 64 }}>
        <div className="mono">Archive 01</div>
        <h1 style={{ fontSize: 48, margin: "16px 0" }}>Shadowsculpt Collection</h1>
        <p className="muted" style={{ maxWidth: 560 }}>
          {locale === "en"
            ? "A quiet uniform for the night city. Heavy textures, controlled volume, and muted structure."
            : "Спокойная форма для ночного города. Плотные фактуры, контролируемый объем и сдержанная структура."}
        </p>
      </section>

    </>
  );
}

export function CatalogTitle() {
  const { t } = useLanguage();
  return (
    <div className="mono" style={{ marginBottom: 16 }}>
      {t.catalog}
    </div>
  );
}
