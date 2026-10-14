export type Shot = {
  id: string;
  name: string;
  src: string;
  tvUrl?: string;
  owned: boolean;
  /** Original file for API upload (in-memory only — never serialized). */
  file?: File;
  /** Server storage path for kept remote shots (edit mode — never serialized). */
  storagePath?: string;
};

let seq = 0;

export function nextShotId(): string {
  seq += 1;
  return `shot-${Date.now().toString(36)}-${seq.toString(36)}`;
}

export function shotFromFile(file: File): Shot {
  return {
    id: nextShotId(),
    name: file.name || `pasted-${new Date().toISOString().slice(11, 19).replaceAll(":", "")}.png`,
    src: URL.createObjectURL(file),
    owned: true,
    file,
  };
}

const IMG_EXT = /\.(png|jpe?g|webp|gif)(\?.*)?$/i;

/**
 * Normalize a TradingView share link (/x/<ID>/) to its s3 snapshot image,
 * or pass through a direct image URL. Throws with a user-facing message.
 */
export function normalizeTvUrl(raw: string): { src: string; tvUrl?: string } {
  const input = raw.trim();
  if (!input) throw new Error("Paste a TradingView link or image URL first.");
  const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
  let url: URL;
  try {
    url = new URL(withScheme);
  } catch {
    throw new Error("That URL does not look valid.");
  }
  const host = url.hostname.toLowerCase();
  if (host === "s3.tradingview.com" && IMG_EXT.test(url.pathname)) {
    return { src: url.toString() };
  }
  if (host.endsWith("tradingview.com")) {
    const m = url.pathname.match(/\/x\/([A-Za-z0-9]+)\/?/);
    if (m) {
      return {
        src: `https://s3.tradingview.com/snapshots/t/${m[1]}.png`,
        tvUrl: url.toString(),
      };
    }
    throw new Error(
      "Use TradingView “Share snapshot” (/x/ link) — workspace /chart/ links cannot embed as images.",
    );
  }
  if (IMG_EXT.test(url.pathname)) return { src: url.toString() };
  throw new Error("URL must point to an image (png, jpg, webp, gif) or a TradingView /x/ link.");
}

/** Serializable subset for LocalStorage (blob: URLs do not survive reload). */
export function serializeShots(shots: Shot[]): { name: string; src?: string; tvUrl?: string }[] {
  return shots.map((s) => ({
    name: s.name,
    ...(s.src.startsWith("http") ? { src: s.src } : {}),
    ...(s.tvUrl ? { tvUrl: s.tvUrl } : {}),
  }));
}

export function revokeShots(shots: Shot[]): void {
  for (const s of shots) {
    if (s.owned) {
      try {
        URL.revokeObjectURL(s.src);
      } catch {
        /* ignore */
      }
    }
  }
}
