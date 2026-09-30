"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ApiError, apiFetch } from "@/lib/api-client";
import {
  clearSession,
  getStoredSession,
  isAccessTokenExpired,
  saveSession,
  type PublicSession,
  type PublicUser,
  type StoredSession,
} from "@/lib/auth/session";

export type AuthStatus = "loading" | "authed" | "anon";

type SessionResponse = {
  user: PublicUser;
  session: PublicSession | null;
  confirmationRequired?: boolean;
};

export type RecoveryInput = {
  password: string;
  code?: string;
  access_token?: string;
  refresh_token?: string;
};

type AuthContextValue = {
  status: AuthStatus;
  user: PublicUser | null;
  signup: (input: {
    name: string;
    email: string;
    password: string;
  }) => Promise<{ confirmationRequired: boolean }>;
  login: (input: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (input: RecoveryInput) => Promise<void>;
  refresh: () => Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function applySession(data: StoredSession): void {
  saveSession(data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [user, setUser] = useState<PublicUser | null>(null);

  const refresh = useCallback(async (): Promise<boolean> => {
    const stored = getStoredSession();
    const refreshToken = stored?.session.refresh_token;
    if (!refreshToken) return false;
    try {
      const data = await apiFetch<SessionResponse>("/auth/refresh", {
        method: "POST",
        body: { refresh_token: refreshToken },
        token: null,
      });
      if (!data.session) return false;
      applySession({ user: data.user, session: data.session });
      setUser(data.user);
      setStatus("authed");
      return true;
    } catch {
      return false;
    }
  }, []);

  // Bootstrap: validate the stored session, refreshing first when expired.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = getStoredSession();
      if (!stored) {
        if (!cancelled) setStatus("anon");
        return;
      }
      if (isAccessTokenExpired(stored)) {
        const ok = await refresh();
        if (!cancelled) {
          if (!ok) {
            clearSession();
            setStatus("anon");
          }
        }
        return;
      }
      try {
        const data = await apiFetch<{ user: PublicUser }>("/auth/me");
        if (!cancelled) {
          setUser(data.user);
          setStatus("authed");
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const ok = await refresh();
          if (!cancelled && !ok) {
            clearSession();
            setStatus("anon");
          }
        } else if (!cancelled) {
          // Network failure — keep the stored session, let screens retry.
          setUser(stored.user);
          setStatus("authed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  const signup = useCallback(
    async (input: { name: string; email: string; password: string }) => {
      const data = await apiFetch<SessionResponse>("/auth/signup", {
        method: "POST",
        body: input,
        token: null,
      });
      if (data.session) {
        applySession({ user: data.user, session: data.session });
        setUser(data.user);
        setStatus("authed");
        return { confirmationRequired: false };
      }
      return { confirmationRequired: true };
    },
    [],
  );

  const login = useCallback(
    async (input: { email: string; password: string }) => {
      const data = await apiFetch<SessionResponse>("/auth/login", {
        method: "POST",
        body: input,
        token: null,
      });
      if (!data.session) {
        throw new ApiError(
          401,
          "invalid_credentials",
          "Invalid email or password.",
        );
      }
      applySession({ user: data.user, session: data.session });
      setUser(data.user);
      setStatus("authed");
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } catch {
      // Best effort — local state is cleared either way.
    }
    clearSession();
    setUser(null);
    setStatus("anon");
  }, []);

  const forgotPassword = useCallback(async (email: string) => {
    await apiFetch("/auth/forgot-password", {
      method: "POST",
      body: { email },
      token: null,
    });
  }, []);

  const resetPassword = useCallback(async (input: RecoveryInput) => {
    await apiFetch("/auth/reset-password", {
      method: "POST",
      body: {
        password: input.password,
        ...(input.code ? { code: input.code } : {}),
        ...(input.access_token ? { access_token: input.access_token } : {}),
        ...(input.refresh_token ? { refresh_token: input.refresh_token } : {}),
      },
      token: input.access_token ?? null,
    });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      signup,
      login,
      logout,
      forgotPassword,
      resetPassword,
      refresh,
    }),
    [status, user, signup, login, logout, forgotPassword, resetPassword, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
