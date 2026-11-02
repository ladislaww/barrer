"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { User } from "@/lib/db/types";

export function AccountProfileForm({ user }: { user: User }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim() || undefined,
      city: String(formData.get("city") ?? "").trim() || undefined,
      street: String(formData.get("street") ?? "").trim() || undefined,
      house: String(formData.get("house") ?? "").trim() || undefined,
      building: String(formData.get("building") ?? "").trim() || undefined,
      postal: String(formData.get("postal") ?? "").trim() || undefined,
      password: String(formData.get("password") ?? "") || undefined
    };

    const res = await fetch("/api/account/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    setMessage(res.ok ? "Данные сохранены" : "Не удалось сохранить данные");
    router.refresh();
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="mono">Profile</div>
      {message ? <p className="muted" style={{ margin: 0 }}>{message}</p> : null}
      <div>
        <label htmlFor="name">Имя</label>
        <input id="name" name="name" defaultValue={user.name ?? ""} required />
      </div>
      <div>
        <label>Email</label>
        <input value={user.email} disabled />
      </div>
      <div>
        <label htmlFor="phone">Телефон</label>
        <input id="phone" name="phone" defaultValue={user.phone ?? ""} type="tel" />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
        <div>
          <label htmlFor="city">Город</label>
          <input id="city" name="city" defaultValue={user.city ?? ""} />
        </div>
        <div>
          <label htmlFor="street">Улица</label>
          <input id="street" name="street" defaultValue={user.street ?? ""} />
        </div>
        <div>
          <label htmlFor="house">Дом</label>
          <input id="house" name="house" defaultValue={user.house ?? ""} />
        </div>
        <div>
          <label htmlFor="building">Корпус</label>
          <input id="building" name="building" defaultValue={user.building ?? ""} />
        </div>
        <div>
          <label htmlFor="postal">Индекс</label>
          <input id="postal" name="postal" defaultValue={user.postal ?? ""} />
        </div>
      </div>
      <div>
        <label htmlFor="password">Новый пароль</label>
        <input id="password" name="password" type="password" minLength={8} autoComplete="new-password" />
      </div>
      <button className="btn" type="submit" disabled={saving}>
        {saving ? "..." : "Сохранить"}
      </button>
    </form>
  );
}
