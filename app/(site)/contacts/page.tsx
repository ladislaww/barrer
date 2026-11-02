import { contactChannels, hasAnyContacts, legalDetails } from "@/lib/store-info";

export const metadata = { title: "Контакты — Barrer" };

export default function ContactsPage() {
  const channels = contactChannels();
  const details = legalDetails();

  return (
    <div className="page">
      <div className="container" style={{ maxWidth: 760 }}>
        <div className="mono">Contacts</div>
        <h1 style={{ fontSize: 36 }}>Контакты</h1>
        <div className="card">
          {hasAnyContacts() ? (
            <>
              {channels.length > 0 ? (
                <dl style={{ display: "grid", gap: 10, margin: 0 }}>
                  {channels.map((channel) => (
                    <div key={channel.label} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                      <dt className="muted" style={{ minWidth: 110 }}>{channel.label}</dt>
                      <dd style={{ margin: 0 }}>
                        <a href={channel.href} className="nav-link">{channel.value}</a>
                      </dd>
                    </div>
                  ))}
                </dl>
              ) : null}

              {details.length > 0 ? (
                <>
                  <div className="mono" style={{ marginTop: 24 }}>Реквизиты</div>
                  <dl style={{ display: "grid", gap: 10, margin: "12px 0 0" }}>
                    {details.map((detail) => (
                      <div key={detail.label} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <dt className="muted" style={{ minWidth: 110 }}>{detail.label}</dt>
                        <dd style={{ margin: 0 }}>{detail.value}</dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : null}
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              Контакты появятся здесь в ближайшее время.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
