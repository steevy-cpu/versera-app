import { getToken } from "./auth";
import type { ApiError } from "./types";

const BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ??
  "https://versera-app-production.up.railway.app";

async function request<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = getToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content — return undefined cast as T
  if (response.status === 204) return undefined as T;

  const json = await response.json().catch(() => ({ error: "Request failed" }));

  if (!response.ok) {
    const err: ApiError = {
      message: (json as { error?: string }).error ?? "Request failed",
      status: response.status,
    };
    throw err;
  }

  return json as T;
}

export const api = {
  get: <T>(path: string): Promise<T> => request<T>("GET", path),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>("PUT", path, body),
  delete: <T>(path: string): Promise<T> => request<T>("DELETE", path),
};
