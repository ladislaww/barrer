import Link from "next/link";
import { contactChannels, storeInfo } from "@/lib/store-info";

export function Footer() {
  const channels = contactChannels();

  return (
    <footer className="page">
      <div className="divider" />
      <div className="container" style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
        <div>
          <div className="mono">Barrer Atelier</div>
          <p className="muted">Минималистичные силуэты. Скульптурный объем. Ночные фактуры.</p>
          {storeInfo.legalName ? (
            <p className="muted" style={{ fontSize: 12 }}>{storeInfo.legalName}</p>
          ) : null}
        </div>
        <div className="mono" style={{ marginLeft: "auto" }}>
          {channels.map((channel) => (
            <div key={channel.label}>
              <a href={channel.href} className="nav-link">{channel.value}</a>
            </div>
          ))}
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 12 }}>
            <Link href="/contacts" className="nav-link">Контакты</Link>
            <Link href="/offer" className="nav-link">Оферта</Link>
            <Link href="/privacy" className="nav-link">Персональные данные</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
