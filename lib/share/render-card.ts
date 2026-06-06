/**
 * Client-side share card renderer (Sprint 50).
 *
 * Render full IG-Story portrait (1080×1920) di canvas browser — bypass
 * server-side next/og yang sering bermasalah dgn Satori (size limit,
 * font, etc). Hasil: PNG blob siap dishare via Web Share API atau
 * download.
 *
 * Pakai HTML5 canvas API native — no external dependency.
 */

export type ShareCardData = {
  title: string;
  status: "upcoming" | "live" | "completed" | "cancelled";
  scheduledAt: Date | string;
  scheduledEndAt: Date | string | null;
  venueName: string | null;
  format: string;
  playerCount: number;
  completedMatches: number;
  /** Top 5 sudah pre-sorted desc by points di server. */
  top: Array<{
    name: string;
    wins: number;
    draws: number;
    losses: number;
    points: number;
  }>;
  /** Absolute URL ke cover photo. Null → gradient fallback. */
  coverPhotoUrl: string | null;
  /** Absolute URL ke logo Carsel (untuk corner brand). */
  logoUrl: string;
  sessionShortId: string;
};

const W = 1080;
const H = 1920;
const COVER_H = Math.round(H * 0.35);

const STATUS_BG: Record<ShareCardData["status"], string> = {
  upcoming: "#F59E0B",
  live: "#EF4444",
  completed: "#15803D",
  cancelled: "#6B7280",
};

const STATUS_LABEL: Record<ShareCardData["status"], string> = {
  upcoming: "📅 UPCOMING",
  live: "🔴 LIVE",
  completed: "✅ SELESAI",
  cancelled: "❌ DIBATALKAN",
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`load image fail: ${src}`));
    img.src = src;
  });
}

function safeLoadImage(src: string): Promise<HTMLImageElement | null> {
  return loadImage(src).catch(() => null);
}

function fmtDateID(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function fmtTimeID(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function fmtTimeRange(
  s: Date | string,
  e: Date | string | null
): string {
  if (!e) return fmtTimeID(s) + " WIB";
  return `${fmtTimeID(s)} – ${fmtTimeID(e)} WIB`;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function ellipsizeText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let trimmed = text;
  while (trimmed.length > 1) {
    trimmed = trimmed.slice(0, -1);
    if (ctx.measureText(trimmed + "…").width <= maxWidth)
      return trimmed.trimEnd() + "…";
  }
  return text;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement | null
) {
  if (img) {
    // object-fit: cover
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const targetAspect = W / COVER_H;
    let sx = 0;
    let sy = 0;
    let sw = img.naturalWidth;
    let sh = img.naturalHeight;
    if (imgAspect > targetAspect) {
      // image lebih lebar → crop sides
      const desiredW = sh * targetAspect;
      sx = (sw - desiredW) / 2;
      sw = desiredW;
    } else {
      const desiredH = sw / targetAspect;
      sy = (sh - desiredH) / 2;
      sh = desiredH;
    }
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, W, COVER_H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, COVER_H);
    grad.addColorStop(0, "#FB7185");
    grad.addColorStop(0.5, "#F43F5E");
    grad.addColorStop(1, "#BE123C");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, COVER_H);
    ctx.font = "bold 200px system-ui";
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🎾", W / 2, COVER_H / 2);
  }
  // Dark gradient overlay di bawah cover untuk transisi ke body
  const overlay = ctx.createLinearGradient(0, COVER_H - 200, 0, COVER_H);
  overlay.addColorStop(0, "rgba(15,118,110,0)");
  overlay.addColorStop(1, "rgba(15,118,110,0.95)");
  ctx.fillStyle = overlay;
  ctx.fillRect(0, COVER_H - 200, W, 200);
}

function drawBrandLogo(
  ctx: CanvasRenderingContext2D,
  logo: HTMLImageElement | null
) {
  // White rounded box top-left dengan logo image
  const boxX = 36;
  const boxY = 36;
  const boxW = 88;
  const boxH = 88;
  ctx.save();
  roundRect(ctx, boxX, boxY, boxW, boxH, 14);
  ctx.fillStyle = "#fff";
  ctx.fill();
  ctx.restore();
  if (logo) {
    // logo fit-cover di box
    const pad = 4;
    ctx.drawImage(logo, boxX + pad, boxY + pad, boxW - 2 * pad, boxH - 2 * pad);
  } else {
    ctx.font = "bold 38px system-ui";
    ctx.fillStyle = "#0F766E";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CC", boxX + boxW / 2, boxY + boxH / 2);
  }
}

function drawStatusBadge(
  ctx: CanvasRenderingContext2D,
  status: ShareCardData["status"]
) {
  const label = STATUS_LABEL[status];
  ctx.font = "800 28px system-ui";
  const padX = 24;
  const padY = 12;
  const textW = ctx.measureText(label).width;
  const badgeW = textW + 2 * padX;
  const badgeH = 52;
  const x = W - 36 - badgeW;
  const y = 36;
  ctx.save();
  roundRect(ctx, x, y, badgeW, badgeH, 999);
  ctx.fillStyle = STATUS_BG[status];
  ctx.shadowColor = "rgba(0,0,0,0.25)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 4;
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + badgeW / 2, y + badgeH / 2 + padY / 2);
}

function drawBody(ctx: CanvasRenderingContext2D, data: ShareCardData) {
  const padX = 56;
  let y = COVER_H + 32;

  // Title
  ctx.fillStyle = "#fff";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = "900 72px system-ui";
  const safeTitle = ellipsizeText(ctx, data.title, W - 2 * padX);
  ctx.fillText(safeTitle, padX, y);
  y += 84;

  // Date
  ctx.font = "600 30px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.fillText(fmtDateID(data.scheduledAt), padX, y);
  y += 44;

  // Time + venue
  ctx.font = "600 26px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const timeStr = fmtTimeRange(data.scheduledAt, data.scheduledEndAt);
  const venueStr = data.venueName ? ` · ${data.venueName}` : "";
  ctx.fillText(timeStr + venueStr, padX, y);
  y += 56;

  // Stat strip — 3 tiles
  const stripGap = 16;
  const stripW = W - 2 * padX;
  const tileW = (stripW - 2 * stripGap) / 3;
  const tileH = 130;
  drawStatTile(ctx, padX, y, tileW, tileH, String(data.playerCount), "Pemain");
  drawStatTile(
    ctx,
    padX + tileW + stripGap,
    y,
    tileW,
    tileH,
    String(data.completedMatches),
    "Match"
  );
  drawStatTile(
    ctx,
    padX + 2 * (tileW + stripGap),
    y,
    tileW,
    tileH,
    capitalize(data.format),
    "Format",
    true
  );
  y += tileH + 40;

  // Leaderboard header
  ctx.font = "800 32px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.textAlign = "left";
  if (data.top.length > 0) {
    ctx.fillText("🏆 Leaderboard", padX, y);
    y += 50;
    const rowH = 88;
    const rowGap = 14;
    const medals = ["🥇", "🥈", "🥉"];
    for (let i = 0; i < data.top.length; i++) {
      const p = data.top[i];
      const isFirst = i === 0;
      // Row background
      ctx.save();
      roundRect(ctx, padX, y, stripW, rowH, 16);
      ctx.fillStyle = isFirst
        ? "rgba(255,255,255,0.22)"
        : "rgba(255,255,255,0.12)";
      ctx.fill();
      if (isFirst) {
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255,255,255,0.5)";
        ctx.stroke();
      }
      ctx.restore();

      // Rank
      const rankX = padX + 32;
      ctx.font = `900 ${i < 3 ? 44 : 32}px system-ui`;
      ctx.textAlign = "center";
      ctx.fillStyle = isFirst ? "#FACC15" : "#fff";
      ctx.textBaseline = "middle";
      const rankLabel = i < 3 ? medals[i] : `${i + 1}`;
      ctx.fillText(rankLabel, rankX, y + rowH / 2);

      // Name
      ctx.font = "800 32px system-ui";
      ctx.textAlign = "left";
      ctx.fillStyle = "#fff";
      const nameMaxW = stripW - 200 - 130; // minus rank area + points area
      const name = ellipsizeText(ctx, p.name, nameMaxW);
      ctx.fillText(name, padX + 90, y + 32);

      // W/D/L stats sub
      ctx.font = "600 20px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(
        `${p.wins}W · ${p.draws}D · ${p.losses}L`,
        padX + 90,
        y + 64
      );

      // Points (right)
      ctx.font = "900 44px system-ui";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillStyle = isFirst ? "#FACC15" : "#fff";
      ctx.fillText(String(p.points), padX + stripW - 28, y + rowH / 2);

      y += rowH + rowGap;
    }
  } else {
    ctx.save();
    roundRect(ctx, padX, y, stripW, 100, 20);
    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fill();
    ctx.restore();
    ctx.font = "700 28px system-ui";
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Match belum dimulai", W / 2, y + 50);
    y += 120;
  }

  // Footer
  const footerY = H - 80;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(padX, footerY);
  ctx.lineTo(W - padX, footerY);
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.restore();
  ctx.font = "700 22px system-ui";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText("Live score & info", padX, footerY + 28);
  ctx.font = "800 26px system-ui";
  ctx.textAlign = "right";
  ctx.fillStyle = "#fff";
  ctx.fillText(
    `carsel.club/s/${data.sessionShortId}`,
    W - padX,
    footerY + 28
  );
}

function drawStatTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  value: string,
  label: string,
  smaller = false
) {
  ctx.save();
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = "rgba(255,255,255,0.18)";
  ctx.fill();
  ctx.lineWidth = 1;
  ctx.strokeStyle = "rgba(255,255,255,0.22)";
  ctx.stroke();
  ctx.restore();
  ctx.fillStyle = "#fff";
  ctx.font = smaller ? "900 30px system-ui" : "900 48px system-ui";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, x + w / 2, y + h / 2 - 14);
  ctx.font = "700 18px system-ui";
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillText(label.toUpperCase(), x + w / 2, y + h / 2 + 28);
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Render share card portrait 1080×1920 → returns PNG blob.
 */
export async function renderSessionShareCard(
  data: ShareCardData
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context tidak tersedia");

  // Background gradient
  const bg = ctx.createLinearGradient(0, 0, 0, H);
  bg.addColorStop(0, "#14B8A6");
  bg.addColorStop(0.6, "#0F766E");
  bg.addColorStop(1, "#134E4A");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Pre-load images
  const [coverImg, logoImg] = await Promise.all([
    data.coverPhotoUrl
      ? safeLoadImage(data.coverPhotoUrl)
      : Promise.resolve(null),
    safeLoadImage(data.logoUrl),
  ]);

  drawCover(ctx, coverImg);
  drawBrandLogo(ctx, logoImg);
  drawStatusBadge(ctx, data.status);
  drawBody(ctx, data);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/png", 0.95)
  );
  if (!blob) throw new Error("toBlob returned null");
  return blob;
}
