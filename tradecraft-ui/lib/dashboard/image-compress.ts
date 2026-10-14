/**
 * Client-side screenshot compression. Screenshots (often multi-MB PNGs) are
 * downscaled and re-encoded before preview + upload so storage stays small
 * while charts remain crisp. Never throws — any failure returns the original.
 */

const MAX_SIDE = 1920;
const QUALITY = 0.85;
/** Files at or under this size skip compression entirely. */
const SKIP_UNDER_BYTES = 400 * 1024;

const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"]);

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((b) => resolve(b), type, quality);
    } catch {
      resolve(null);
    }
  });
}

function withExtension(name: string, ext: string): string {
  const base = name.includes(".") ? name.replace(/\.[^.]*$/, "") : name;
  return `${base || "screenshot"}.${ext}`;
}

export async function compressImageFile(file: File): Promise<File> {
  try {
    if (!file.type.startsWith("image/")) return file;
    if (SKIP_TYPES.has(file.type)) return file;
    if (file.size <= SKIP_UNDER_BYTES) return file;
    if (typeof createImageBitmap !== "function") return file;

    const bitmap = await createImageBitmap(file);
    const { width, height } = bitmap;
    if (!width || !height) {
      bitmap.close();
      return file;
    }
    const scale = Math.min(1, MAX_SIDE / Math.max(width, height));
    const w = Math.max(1, Math.round(width * scale));
    const h = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close();

    let blob = await canvasToBlob(canvas, "image/webp", QUALITY);
    let name = withExtension(file.name, "webp");
    let type = "image/webp";
    if (!blob || blob.size === 0) {
      blob = await canvasToBlob(canvas, "image/jpeg", QUALITY);
      name = withExtension(file.name, "jpg");
      type = "image/jpeg";
    }
    if (!blob || blob.size === 0 || blob.size >= file.size) return file;
    return new File([blob], name, { type, lastModified: file.lastModified });
  } catch {
    return file;
  }
}
