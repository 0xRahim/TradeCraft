"use client";

/**
 * Persistent byte-cache for private trade screenshots.
 *
 * Signed read URLs expire (~60s) and are re-minted on every resolve, so the
 * browser HTTP cache can never hit across visits. Instead we fetch the bytes
 * once, store them in the Cache Storage API keyed by `storagePath` (screenshot
 * paths are effectively immutable — edits create new rows/paths), and serve
 * `objectURL`s from cache on repeat views — including across reloads.
 * Every step degrades to a direct signed URL; caching never breaks loading.
 */

const CACHE_NAME = "tradecraft-shots-v1";
const INDEX_KEY = "tradecraft.shot-cache.index.v1";
const MAX_ENTRIES = 300;
/** Session object URLs (page lifetime; never revoked while displayable). */
const MAX_LIVE = 500;

const liveUrls = new Map<string, string>();

function cacheSupported(): boolean {
  return typeof window !== "undefined" && "caches" in window;
}

/** Synthetic same-origin URL used purely as a cache key (never fetched). */
function keyUrl(path: string): string {
  return `/__shotcache__/v1?p=${encodeURIComponent(path)}`;
}

type IndexEntry = { key: string; at: number };

function readIndex(): IndexEntry[] {
  try {
    const raw = window.localStorage.getItem(INDEX_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((e) => {
      if (e && typeof e === "object" && typeof (e as IndexEntry).key === "string") {
        return [{ key: (e as IndexEntry).key, at: Number((e as IndexEntry).at) || 0 }];
      }
      return [];
    });
  } catch {
    return [];
  }
}

function touchIndex(key: string): void {
  try {
    const ix = readIndex().filter((e) => e.key !== key);
    ix.unshift({ key, at: Date.now() });
    const evicted = ix.splice(MAX_ENTRIES);
    window.localStorage.setItem(INDEX_KEY, JSON.stringify(ix));
    if (evicted.length > 0 && cacheSupported()) {
      void (async () => {
        try {
          const cache = await window.caches.open(CACHE_NAME);
          await Promise.all(evicted.map((e) => cache.delete(e.key)));
        } catch {
          /* eviction is best-effort */
        }
      })();
    }
  } catch {
    /* index unavailable (private mode) — bytes still cached */
  }
}

function liveGet(path: string): string | null {
  const url = liveUrls.get(path);
  if (!url) return null;
  // Refresh LRU position.
  liveUrls.delete(path);
  liveUrls.set(path, url);
  return url;
}

function liveSet(path: string, url: string): void {
  liveUrls.delete(path);
  liveUrls.set(path, url);
  // Cap size without revoking: a revoked URL would break images still on screen.
  while (liveUrls.size > MAX_LIVE) {
    const oldest = liveUrls.keys().next();
    if (oldest.done) break;
    liveUrls.delete(oldest.value);
  }
}

async function fetchAndStore(
  path: string,
  sign: () => Promise<string>,
): Promise<string | null> {
  const signedUrl = await sign();
  const res = await fetch(signedUrl);
  if (!res.ok) return signedUrl;
  const blob = await res.blob();
  if (!blob.size) return signedUrl;
  const url = URL.createObjectURL(blob);
  liveSet(path, url);
  if (cacheSupported()) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      await cache.put(
        keyUrl(path),
        new Response(blob, {
          headers: { "Content-Type": blob.type || "application/octet-stream" },
        }),
      );
      touchIndex(keyUrl(path));
    } catch {
      /* persistent cache unavailable — session URL still works */
    }
  }
  return url;
}

/**
 * Resolve a storage path to a renderable URL, serving cached bytes when
 * available. `sign` mints a fresh signed URL on cache miss. Null on failure.
 */
export async function resolveCachedShotSrc(
  path: string,
  sign: () => Promise<string>,
): Promise<string | null> {
  const live = liveGet(path);
  if (live) return live;
  if (cacheSupported()) {
    try {
      const cache = await window.caches.open(CACHE_NAME);
      const hit = await cache.match(keyUrl(path));
      if (hit) {
        const blob = await hit.blob();
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          liveSet(path, url);
          return url;
        }
        await cache.delete(keyUrl(path));
      }
    } catch {
      /* fall through to network */
    }
  }
  try {
    return await fetchAndStore(path, sign);
  } catch {
    return null;
  }
}
