import { AccountLoginForm } from "@/components/AccountLoginForm";

export const metadata = { title: "Вход — Barrer" };

export default function AccountLoginPage() {
  return (
    <div className="page">
      <div className="container">
        <AccountLoginForm />
      </div>
    </div>
  );
}
