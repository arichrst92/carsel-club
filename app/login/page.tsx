import Image from "next/image";
import { PhoneForm } from "@/components/auth/PhoneForm";

export const metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div className="app-shell">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <Image
          src="/logo-icon.png"
          alt="Carsel Club"
          width={1024}
          height={1024}
          priority
          className="w-24 h-auto select-none drop-shadow-sm"
        />

        <div className="text-center space-y-1">
          <h1 className="text-2xl">Selamat datang</h1>
          <p className="text-text-600 text-sm font-semibold">
            Masuk dengan nomor WhatsApp kamu
          </p>
        </div>

        <PhoneForm />

        <p className="text-text-400 text-xs text-center max-w-xs leading-relaxed">
          Kami akan kirim kode 6 digit ke WhatsApp kamu untuk verifikasi.
        </p>
      </main>
    </div>
  );
}
