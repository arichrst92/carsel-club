import { PhoneForm } from "@/components/auth/PhoneForm";

export const metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div className="app-shell">
      <header className="subscreen-header" style={{ borderBottom: "none" }}>
        <div style={{ width: 40 }} />
        <h2 className="subscreen-title">Verifikasi WhatsApp</h2>
        <div style={{ width: 40 }} />
      </header>

      <PhoneForm />
    </div>
  );
}
