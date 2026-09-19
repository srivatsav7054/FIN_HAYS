/**
 * Typed API client for the Sahaara backend.
 * Flip USE_MOCKS to false to hit the real backend — that is the only change needed.
 */
export const BASE_URL = "http://localhost:8000/api/v1";
export const USE_MOCKS = true;

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return (await res.json()) as T;
}
