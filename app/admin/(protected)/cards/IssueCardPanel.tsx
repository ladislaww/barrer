"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FoundCard = { id: string; number: string; status: string; createdAt: string };
type FoundUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  card: FoundCard | null;
};

const ISSUE_ERRORS: Record<string, string> = {
  INVALID_EMAIL: "Некорректный e-mail.",
  USER_NOT_FOUND: "Пользователь с таким e-mail не найден.",
  ALREADY_HAS_CARD: "У этого e-mail уже есть карта.",
  GENERATION_FAILED: "Не удалось подобрать свободный номер. Повторите попытку."
};

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });
}

export function IssueCardPanel() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [user, setUser] = useState<FoundUser | null>(null);
  const [searched, setSearched] = useState(false);
  const [issuedNumber, setIssuedNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim()) return;
    setBusy(true);
    setError(null);
    setIssuedNumber(null);
    try {
      const response = await fetch(`/api/admin/cards/lookup?email=${encodeURIComponent(email.trim())}`);
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? "Не удалось выполнить поиск.");
        setUser(null);
      } else {
        setUser(data.user);
      }
      setSearched(true);
    } catch {
      setError("Сеть недоступна. Повторите попытку.");
    } finally {
      setBusy(false);
    }
  }

  async function issue() {
    if (!user) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email })
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        setError(ISSUE_ERRORS[data.reason] ?? "Не удалось выдать карту.");
      } else {
        setIssuedNumber(data.card.number);
        setUser({ ...user, card: data.card });
        router.refresh();
      }
    } catch {
      setError("Сеть недоступна. Повторите попытку.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setEmail("");
    setUser(null);
    setSearched(false);
    setIssuedNumber(null);
    setError(null);
  }

  return (
    <div className="card" style={{ gap: 16 }}>
      <div className="mono" style={{ fontSize: 11 }}>ВЫДАЧА КАРТЫ</div>

      <form onSubmit={search} style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "flex-end" }}>
        <label style={{ display: "grid", gap: 6, flex: "1 1 320px" }}>
          <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>
            E-MAIL ПОЛЬЗОВАТЕЛЯ
          </span>
          <input
            type="email"
            value={email}
            placeholder="user@example.com"
            onChange={(event) => {
              setEmail(event.target.value);
              setSearched(false);
              setUser(null);
              setIssuedNumber(null);
              setError(null);
            }}
            style={{
              background: "var(--bg)",
              border: "1px solid var(--border)",
              color: "var(--text)",
              padding: "8px 10px",
              fontSize: 13,
              width: "100%"
            }}
          />
        </label>
        <button type="submit" className="btn" style={{ fontSize: 12, padding: "9px 18px" }} disabled={busy || !email.trim()}>
          {busy ? "…" : "Найти"}
        </button>
        {searched ? (
          <button type="button" className="btn secondary" style={{ fontSize: 12, padding: "9px 18px" }} onClick={reset} disabled={busy}>
            Сбросить
          </button>
        ) : null}
      </form>

      {error ? (
        <div style={{ fontSize: 13, color: "#f44336" }}>{error}</div>
      ) : null}

      {searched && !user && !error ? (
        <div style={{ fontSize: 13, color: "var(--muted)" }}>
          Пользователь с таким e-mail не найден. Карта выдаётся только зарегистрированным пользователям.
        </div>
      ) : null}

      {user ? (
        <div style={{ display: "grid", gap: 12, borderTop: "1px solid var(--border)", paddingTop: 16 }}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={{ fontSize: 15 }}>{user.name ?? "Без имени"}</div>
            <div style={{ fontSize: 13, color: "var(--muted)" }}>{user.email}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Зарегистрирован {formatDate(user.createdAt)}
            </div>
          </div>

          {user.card ? (
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
              <Detail label="Номер карты" value={user.card.number} mono big />
              <Detail label="Дата выдачи" value={formatDate(user.card.createdAt)} />
              <Detail label="Статус" value={user.card.status} mono />
            </div>
          ) : (
            <button type="button" className="btn" style={{ fontSize: 12, padding: "9px 18px", justifySelf: "start" }} onClick={issue} disabled={busy}>
              {busy ? "Выдаём…" : "Выдать карту"}
            </button>
          )}

          {issuedNumber ? (
            <div style={{ fontSize: 13, color: "#4caf50" }}>
              Карта выдана. Номер: <span style={{ fontFamily: "monospace" }}>{issuedNumber}</span>
            </div>
          ) : user.card ? (
            <div style={{ fontSize: 12, color: "var(--muted)" }}>
              Карта уже выдана — на один e-mail приходится одна карта.
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function Detail({
  label,
  value,
  mono,
  big
}: {
  label: string;
  value: string;
  mono?: boolean;
  big?: boolean;
}) {
  return (
    <div style={{ display: "grid", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--muted)", fontFamily: "monospace" }}>{label}</span>
      <span
        style={{
          fontSize: big ? 22 : 14,
          fontFamily: mono ? "monospace" : undefined,
          letterSpacing: big ? "0.12em" : undefined
        }}
      >
        {value}
      </span>
    </div>
  );
}
