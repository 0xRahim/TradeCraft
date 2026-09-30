export type PublicUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  emailConfirmed: boolean;
};

export type PublicSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at: number | null;
  token_type: string;
};

const STORAGE_KEY = "tc.session.v1";

export type StoredSession = {
  user: PublicUser;
  session: PublicSession;
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function getStoredSession(): StoredSession | null {
  if (!isBrowser()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredSession>;
    if (!parsed?.session?.access_token || !parsed?.user?.id) return null;
    return parsed as StoredSession;
  } catch {
    return null;
  }
}

export function saveSession(data: StoredSession): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Storage full/blocked — session simply won't persist.
  }
}

export function clearSession(): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // noop
  }
}

export function getAccessToken(): string | null {
  return getStoredSession()?.session.access_token ?? null;
}

/** True when the access token is expired (60s skew) or unusable. */
export function isAccessTokenExpired(
  stored: StoredSession | null = getStoredSession(),
): boolean {
  const expiresAt = stored?.session.expires_at;
  if (typeof expiresAt !== "number") return false;
  return Date.now() / 1000 > expiresAt - 60;
}
