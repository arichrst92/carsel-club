import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { OtpForm } from "@/components/auth/OtpForm";

export const metadata = {
  title: "Verifikasi",
};

type PageProps = {
  searchParams: Promise<{ phone?: string }>;
};

export default async function VerifyPage({ searchParams }: PageProps) {
  const { phone } = await searchParams;

  if (!phone) {
    redirect("/login");
  }

  // Display: 628123456789 → +62 812-345-6789
  const displayPhone = formatPhoneForDisplay(phone!);

  return (
    <div className="app-shell">
      <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-12">
        <Image
          src="/logo-icon.png"
          alt="Carsel Club"
          width={1024}
          height={1024}
          priority
          className="w-20 h-auto select-none drop-shadow-sm"
        />

        <div className="text-center space-y-1">
          <h1 className="text-2xl">Cek WhatsApp</h1>
          <p className="text-text-600 text-sm font-semibold">
            Kode 6 digit dikirim ke
          </p>
          <p className="text-primary-600 text-sm font-bold">{displayPhone}</p>
        </div>

        <OtpForm phone={phone!} />

        <Link
          href="/login"
          className="text-xs text-text-500 hover:text-primary-600 font-semibold underline"
        >
          Ganti nomor
        </Link>
      </main>
    </div>
  );
}

function formatPhoneForDisplay(phone: string): string {
  // 628123456789 → +62 812-3456-789
  if (!phone.startsWith("62")) return phone;
  const rest = phone.slice(2);
  return `+62 ${rest.slice(0, 3)}-${rest.slice(3, 7)}-${rest.slice(7)}`;
}
