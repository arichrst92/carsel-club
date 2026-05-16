/**
 * Fonnte WhatsApp Gateway client.
 * Docs: https://docs.fonnte.com
 *
 * Used for sending OTP and notifications via WhatsApp.
 * Token stored in FONNTE_TOKEN env var (server-only).
 */

interface SendMessageOptions {
  /** Phone number in E.164 format (e.g., "628123456789") or international format */
  target: string;
  /** Message body */
  message: string;
  /** Country code (default: "62" for Indonesia) */
  countryCode?: string;
}

interface FonnteResponse {
  status: boolean;
  reason?: string;
  detail?: string;
  id?: string[];
  process?: string;
  target?: string[];
}

/**
 * Send a WhatsApp message via Fonnte.
 * Throws on network error. Check response.status for delivery status.
 */
export async function sendWhatsApp(
  options: SendMessageOptions
): Promise<FonnteResponse> {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    throw new Error("FONNTE_TOKEN environment variable is not set");
  }

  const formData = new URLSearchParams();
  formData.append("target", options.target);
  formData.append("message", options.message);
  if (options.countryCode) {
    formData.append("countryCode", options.countryCode);
  }

  const response = await fetch("https://api.fonnte.com/send", {
    method: "POST",
    headers: {
      Authorization: token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    throw new Error(
      `Fonnte HTTP error: ${response.status} ${response.statusText}`
    );
  }

  return (await response.json()) as FonnteResponse;
}

/**
 * Send an OTP code via WhatsApp.
 * Formats the message with the Carsel Club brand.
 *
 * DEV FALLBACK: if FONNTE_TOKEN is not set in development,
 * logs OTP to terminal instead of sending. Allows testing
 * login flow without Fonnte fully wired.
 */
export async function sendOtp(
  phone: string,
  code: string
): Promise<FonnteResponse> {
  // Dev fallback when Fonnte not configured
  if (!process.env.FONNTE_TOKEN && process.env.NODE_ENV !== "production") {
    console.log("\n┌─────────────────────────────────────────");
    console.log("│  🔐 DEV OTP (Fonnte not configured)");
    console.log(`│  Phone : ${phone}`);
    console.log(`│  Code  : ${code}`);
    console.log("│  Copy code above untuk verify di /login/verify");
    console.log("└─────────────────────────────────────────\n");
    return { status: true };
  }

  const message = `*Carsel Club*

Kode verifikasi kamu: *${code}*

Kode berlaku 5 menit. Jangan share ke siapa pun.`;

  return sendWhatsApp({
    target: phone,
    message,
  });
}
