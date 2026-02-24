export default function AboutPage() {
  return (
    <div className="page">
      <div className="container" style={{ display: "grid", gap: 24, maxWidth: 760 }}>
        <div className="mono">About</div>
        <h1 style={{ fontSize: 42, margin: 0 }}>Barrer Atelier</h1>
        <p className="muted" style={{ fontSize: 18, lineHeight: 1.6 }}>
          Barrer — это тихая лаборатория силуэта. Мы создаем предметы для медленного города:
          плотные ткани, вытянутые линии, приглушенная фактура. Каждая вещь выдерживает паузу и
          остается актуальной вне сезона.
        </p>
        <div className="card">
          <div className="mono">Principles</div>
          <ul style={{ margin: "12px 0", paddingLeft: 18, color: "var(--muted)", lineHeight: 1.8 }}>
            <li>Монохром и контроль формы.</li>
            <li>Служебные детали вместо декора.</li>
            <li>Тактильность и долговечность материалов.</li>
          </ul>
        </div>
        <p className="muted">
          Если у вас есть вопрос о размерах, материалах или наличии — напишите нам на
          support@barrer.example.
        </p>
      </div>
    </div>
  );
}
