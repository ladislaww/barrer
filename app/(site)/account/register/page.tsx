import { AccountRegisterForm } from "@/components/AccountRegisterForm";

export const metadata = { title: "Регистрация — Barrer" };

export default function AccountRegisterPage() {
  return (
    <div className="page">
      <div className="container">
        <AccountRegisterForm />
      </div>
    </div>
  );
}
