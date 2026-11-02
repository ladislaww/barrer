"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const form = e.currentTarget;
    const email = (form.elements.namedItem("email") as HTMLInputElement).value;
    const password = (form.elements.namedItem("password") as HTMLInputElement).value;

    const result = await signIn("credentials", { email, password, redirect: false });

    if (result?.error) {
      setError("Неверный email или пароль");
      setLoading(false);
    } else {
      router.push("/admin");
      router.refresh();
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)"
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: 400 }}>
        <div className="mono">BARRER / Admin</div>
        <h1 style={{ fontSize: 24, margin: "8px 0 24px" }}>Sign in</h1>

        {error && (
          <p style={{ color: "var(--muted)", margin: "0 0 16px", fontSize: 14 }}>{error}</p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label htmlFor="email" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div>
            <label htmlFor="password" style={{ fontSize: 13, display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
            />
          </div>
          <button className="btn" type="submit" disabled={loading}>
            {loading ? "..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
