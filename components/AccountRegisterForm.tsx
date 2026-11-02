"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

function validatePassword(password: string): string | null {
  if (password.length <= 6) return "Пароль должен содержать более 6 символов";
  if (!/[A-Z]/.test(password)) return "Пароль должен содержать хотя бы одну заглавную букву";
  return null;
}

export function AccountRegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  const passwordError = passwordValue ? validatePassword(passwordValue) : null;
  const hasMinLength = passwordValue.length > 6;
  const hasUppercase = /[A-Z]/.test(passwordValue);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    const pwdErr = validatePassword(password);
    if (pwdErr) {
      setError(pwdErr);
      return;
    }

    if (password !== confirmPassword) {
      setError("Пароли не совпадают");
      return;
    }

    setLoading(true);
    const payload = {
      email: String(formData.get("email") ?? "").trim(),
      password,
      name: String(formData.get("name") ?? "").trim(),
      offerAccepted: formData.get("offerAccepted") === "on",
      privacyAccepted: formData.get("privacyAccepted") === "on"
    };

    if (!payload.offerAccepted || !payload.privacyAccepted) {
      setLoading(false);
      setError("Для регистрации нужно принять оферту и согласие на обработку персональных данных.");
      return;
    }

    const res = await fetch("/api/account/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      setLoading(false);
      setError(res.status === 409 ? "Пользователь с таким email уже существует" : "Ошибка регистрации");
      return;
    }

    await signIn("credentials", {
      email: payload.email,
      password: payload.password,
      redirect: false
    });
    router.push("/account");
    router.refresh();
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
      <div className="mono">Registration</div>
      {error ? <p className="muted" style={{ margin: 0 }}>{error}</p> : null}
      <div>
        <label htmlFor="name">Имя</label>
        <input id="name" name="name" required autoComplete="name" />
      </div>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password">Пароль</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          value={passwordValue}
          onChange={(e) => setPasswordValue(e.target.value)}
        />
        <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
          <PasswordHint met={hasMinLength}>Более 6 символов</PasswordHint>
          <PasswordHint met={hasUppercase}>Хотя бы одна заглавная буква</PasswordHint>
        </div>
      </div>
      <div>
        <label htmlFor="confirmPassword">Повторите пароль</label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>
      <label className="checkbox-line">
        <input name="offerAccepted" type="checkbox" required />
        <span>
          Я ознакомлен(а) и согласен(на) с{" "}
          <Link href="/offer" className="nav-link">публичной офертой</Link>
        </span>
      </label>
      <label className="checkbox-line">
        <input name="privacyAccepted" type="checkbox" required />
        <span>
          Я даю согласие на{" "}
          <Link href="/privacy" className="nav-link">обработку персональных данных</Link>
        </span>
      </label>
      <button className="btn" type="submit" disabled={loading || !!passwordError}>
        {loading ? "..." : "Зарегистрироваться"}
      </button>
      <Link href="/account/login" className="nav-link mono">
        Уже есть аккаунт
      </Link>
    </form>
  );
}

function PasswordHint({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        fontSize: 12,
        color: met ? "var(--text)" : "var(--muted)",
        transition: "color 0.15s"
      }}
    >
      <span style={{ fontSize: 10 }}>{met ? "✓" : "○"}</span>
      {children}
    </div>
  );
}
