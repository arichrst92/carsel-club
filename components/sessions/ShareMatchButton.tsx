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
  url,
}: {
  sessionTitle: string;
  team1Names: string[];
  team2Names: string[];
  team1Score: number;
  team2Score: number;
  url: string;
}): string {
  const team1 = team1Names.filter(Boolean).join(" & ");
  const team2 = team2Names.filter(Boolean).join(" & ");

  let text = `🎾 *Match Result · ${sessionTitle}*\n\n`;

  if (team1Score > team2Score) {
    text += `🏆 *${team1}* menang ${team1Score} - ${team2Score} vs ${team2}\n`;
  } else if (team2Score > team1Score) {
    text += `🏆 *${team2}* menang ${team2Score} - ${team1Score} vs ${team1}\n`;
  } else {
    text += `🤝 *${team1}* seri ${team1Score} - ${team2Score} vs *${team2}*\n`;
  }

  text += `\n🔗 Live score & leaderboard:\n${url}\n`;
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
    const text = buildText({
      sessionTitle,
      team1Names,
      team2Names,
      team1Score,
      team2Score,
      url,
    });

    // Try Web Share API first (best UX on mobile)
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: `${sessionTitle} — Match Result`,
          text,
          url,
        });
        return;
      } catch (e) {
        // User cancelled, that's fine
        if ((e as Error).name === "AbortError") return;
        console.warn("Share API failed, falling back to WA:", e);
      }
    }

    // Fallback: WhatsApp
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
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
