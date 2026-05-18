import { redirect } from "next/navigation";
import Link from "next/link";
import { OtpForm } from "@/components/auth/OtpForm";

export const metadata = {
  title: "OTP Verification",
};

type PageProps = {
  searchParams: Promise<{ phone?: string }>;
};

export default async function VerifyPage({ searchParams }: PageProps) {
  const { phone } = await searchParams;
  if (!phone) redirect("/login");

  return (
    <div className="app-shell">
      <header className="subscreen-header">
        <Link href="/login" className="back-btn" aria-label="Back">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="subscreen-title">OTP Verification</h2>
      </header>

      <OtpForm phone={phone!} />
    </div>
  );
}
