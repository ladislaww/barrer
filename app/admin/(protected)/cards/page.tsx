import { listCardsWithUsers } from "@/lib/db/cards";
import { CardsTable } from "./CardsTable";
import { IssueCardPanel } from "./IssueCardPanel";

export const metadata = { title: "Members Cards — Admin" };
export const dynamic = "force-dynamic";

export default async function CardsPage() {
  const cards = await listCardsWithUsers();
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <div className="mono" style={{ fontSize: 11, color: "var(--muted)" }}>Admin</div>
        <h1 style={{ fontSize: 28, margin: "8px 0 0" }}>Members Cards ({cards.length})</h1>
        <p className="muted" style={{ margin: "8px 0 0", fontSize: 13 }}>
          Номер карты — 8 цифр, генерируется автоматически и уникален. На один e-mail приходится одна карта.
        </p>
      </div>
      <IssueCardPanel />
      <CardsTable cards={cards} />
    </div>
  );
}
