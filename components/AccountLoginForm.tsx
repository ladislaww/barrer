"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function AccountLoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false
    });

    setLoading(false);
    if (result?.error) {
      setError("Неверный email или пароль");
      return;
    }

    router.push("/account");
    router.refresh();
  }

  return (
    <form className="card" onSubmit={handleSubmit} style={{ maxWidth: 460 }}>
      <div className="mono">Account login</div>
      {error ? <p className="muted" style={{ margin: 0 }}>{error}</p> : null}
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>
      <div>
        <label htmlFor="password">Пароль</label>
        <input id="password" name="password" type="password" required autoComplete="current-password" />
      </div>
      <button className="btn" type="submit" disabled={loading}>
        {loading ? "..." : "Войти"}
      </button>
      <Link href="/account/register" className="nav-link mono">
        Создать аккаунт
      </Link>
    </form>
  );
}
