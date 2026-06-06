"use client";

type Props = {
  matchId: string;
  sessionTitle: string;
  team1Names: string[];
  team2Names: string[];
  team1Score: number;
  team2Score: number;
};

function getAppUrl(): string {
  if (typeof window !== "undefined") return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://carsel.club";
}

function buildText({
  sessionTitle,
  team1Names,
  team2Names,
  team1Score,
  team2Score,
}: {
  sessionTitle: string;
  team1Names: string[];
  team2Names: string[];
  team1Score: number;
  team2Score: number;
}): string {
  const team1 = team1Names.filter(Boolean).join(" & ");
  const team2 = team2Names.filter(Boolean).join(" & ");

  let text = `🎾 *Hasil Pertandingan · ${sessionTitle}*\n\n`;

  if (team1Score > team2Score) {
    text += `🏆 *${team1}* menang ${team1Score} - ${team2Score} vs ${team2}\n`;
  } else if (team2Score > team1Score) {
    text += `🏆 *${team2}* menang ${team2Score} - ${team1Score} vs ${team1}\n`;
  } else {
    text += `🤝 *${team1}* seri ${team1Score} - ${team2Score} vs *${team2}*\n`;
  }

  text += `\nvia Carsel Club ⚡`;
  return text;
}

export function ShareMatchButton({
  matchId,
  sessionTitle,
  team1Names,
  team2Names,
  team1Score,
  team2Score,
}: Props) {
  async function handleShare() {
    const url = `${getAppUrl()}/s/match/${matchId}`;
    // Sprint 50: body text WITHOUT URL — supaya tidak duplikat saat
    // navigator.share gabungkan text + url. URL diteruskan via param
    // tunggal navigator.share({url}). Untuk fallback WA, URL ditempel
    // di akhir text.
    const bodyText = buildText({
      sessionTitle,
      team1Names,
      team2Names,
      team1Score,
      team2Score,
    });

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${sessionTitle} — Hasil Pertandingan`,
          text: bodyText, // tanpa URL
          url,
        });
        return;
      } catch (e) {
        if ((e as Error).name === "AbortError") return;
        console.warn("Share API failed, falling back to WA:", e);
      }
    }

    // Fallback: WhatsApp — gabungkan text + url di sini karena wa.me
    // cuma terima 1 parameter text.
    const waText = `${bodyText}\n\n🔗 Live score & leaderboard:\n${url}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(waText)}`;
    window.open(waUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      style={{
        marginTop: 8,
        padding: "8px 14px",
        width: "100%",
        borderRadius: "var(--r-md)",
        border: "1px solid var(--primary-200)",
        background: "var(--primary-50)",
        fontFamily: "var(--font-display)",
        fontWeight: 700,
        fontSize: 12,
        color: "var(--primary-700)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <path d="M16 6l-4-4-4 4" />
        <path d="M12 2v13" />
      </svg>
      Share Hasil
    </button>
  );
}
