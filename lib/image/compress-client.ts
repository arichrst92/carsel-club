/**
 * Client-side image compression (Sprint 48 fix).
 *
 * Pakai canvas — no extra dep. Tujuan: turunkan ukuran payload
 * Server Action ke < 1 MB sebelum dikirim, sekaligus hemat bandwidth
 * dan storage.
 *
 * Strategy:
 * 1. Skip kalau bukan image (return file as is)
 * 2. Skip kalau sudah < 1 MB DAN dimensi <= maxSide (no need to recompress)
 * 3. Resize: scale down sehingga max(width, height) <= maxSide
 * 4. Re-encode JPEG (lossy) atau PNG → JPEG; alpha hilang OK utk avatar/cover
 * 5. Iteratively turunkan quality kalau hasil masih > targetBytes
 *
 * Catatan:
 * - Server tetap re-process via sharp (`lib/storage` pipeline) untuk
 *   metadata strip, watermark, dll. Helper ini cuma utk fit di body limit.
 * - HEIC dari iPhone biasanya sudah di-decode oleh browser saat
 *   ditaruh ke <img>/canvas → output tetap JPEG.
 */

export type CompressOptions = {
  /** Max sisi (px). Default 1920. */
  maxSide?: number;
  /** Target ukuran bytes. Default 900 KB (margin di bawah 1 MB body limit). */
  targetBytes?: number;
  /** Initial quality JPEG (0-1). Default 0.85. */
  initialQuality?: number;
  /** Min quality saat iterate down. Default 0.55. */
  minQuality?: number;
};

const DEFAULTS: Required<CompressOptions> = {
  maxSide: 1920,
  targetBytes: 900 * 1024,
  initialQuality: 0.85,
  minQuality: 0.55,
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Gagal load image untuk compress"));
    img.src = src;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), "image/jpeg", quality);
  });
}

export async function compressImageClient(
  file: File,
  opts: CompressOptions = {}
): Promise<File> {
  // Server only — no-op (kalau ke-import di server tidak crash)
  if (typeof window === "undefined") return file;

  // Non-image → kembalikan apa adanya
  if (!file.type.startsWith("image/")) return file;

  // SVG: jangan rasterize, kembalikan apa adanya
  if (file.type === "image/svg+xml") return file;

  // GIF: animasi akan hilang kalau lewat canvas; kembalikan apa adanya
  // (jika size > limit nanti user lihat error server)
  if (file.type === "image/gif") return file;

  const o = { ...DEFAULTS, ...opts };

  // Quick exit: kecil & file langsung dipakai
  // Tapi kita TIDAK skip walaupun sudah < target — masih perlu cek dimensi,
  // karena foto 800KB tapi 6000x4000 px masih boros saat di-server-process.
  const objectUrl = URL.createObjectURL(file);
  let img: HTMLImageElement;
  try {
    img = await loadImage(objectUrl);
  } catch {
    URL.revokeObjectURL(objectUrl);
    return file; // Fallback aman
  }

  const { naturalWidth: w0, naturalHeight: h0 } = img;
  const longestSide = Math.max(w0, h0);
  const scale = longestSide > o.maxSide ? o.maxSide / longestSide : 1;
  const w = Math.round(w0 * scale);
  const h = Math.round(h0 * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    URL.revokeObjectURL(objectUrl);
    return file;
  }
  // White background untuk JPEG (PNG/HEIC dgn alpha → solid white)
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, w, h);
  ctx.drawImage(img, 0, 0, w, h);
  URL.revokeObjectURL(objectUrl);

  // Iterate quality down until fit
  let quality = o.initialQuality;
  let blob: Blob | null = await canvasToBlob(canvas, quality);
  while (blob && blob.size > o.targetBytes && quality > o.minQuality) {
    quality = Math.max(o.minQuality, quality - 0.1);
    blob = await canvasToBlob(canvas, quality);
  }
  if (!blob) return file;

  // Kalau hasil compress justru lebih besar (rare, mis. PNG screenshot
  // kecil) dan file asli sudah < target → pakai file asli.
  if (blob.size >= file.size && file.size <= o.targetBytes) {
    return file;
  }

  const ext = ".jpg";
  const baseName = file.name.replace(/\.[^./\\]+$/, "");
  return new File([blob], `${baseName}${ext}`, {
    type: "image/jpeg",
    lastModified: Date.now(),
  });
}
