export function Footer() {
  return (
    <footer className="page">
      <div className="divider" />
      <div className="container" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div className="mono">Barrer Atelier</div>
          <p className="muted">Минималистичные силуэты. Скульптурный объем. Ночные фактуры.</p>
        </div>
        <div className="mono" style={{ marginLeft: "auto" }}>
          <div>support@barrer.example</div>
          <div>Instagram / @barrer</div>
        </div>
      </div>
    </footer>
  );
}
