import { getAccessToken } from "@/lib/auth/session";

export function getApiBaseUrl(): string {
  const base =
    process.env["NEXT_PUBLIC_API_URL"] ?? "http://localhost:3001/api";
  return base.replace(/\/$/, "");
}

export type ApiErrorEnvelope = {
  error: { code: string; message: string };
};

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type ApiFetchOptions = {
  method?: string;
  body?: unknown;
  token?: string | null;
};

/** Typed fetch against the tradecraft-api. Attaches the stored access token. */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const token = options.token !== undefined ? options.token : getAccessToken();
  let res: Response;
  try {
    res = await fetch(`${getApiBaseUrl()}${path}`, {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(options.body !== undefined
        ? { body: JSON.stringify(options.body) }
        : {}),
    });
  } catch {
    throw new ApiError(0, "network_error", "Could not reach the server.");
  }

  if (res.status === 204) return undefined as T;

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const envelope = data as Partial<ApiErrorEnvelope> | null;
    const code = envelope?.error?.code ?? "request_failed";
    const message = envelope?.error?.message ?? `Request failed (${res.status}).`;
    throw new ApiError(res.status, code, message);
  }
  return data as T;
}
