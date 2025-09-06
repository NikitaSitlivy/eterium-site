const API = (import.meta.env.VITE_API_URL as string) || '';

export async function apiGet(path: string, init?: RequestInit) {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  const ct = res.headers.get("content-type") || "";
  return ct.includes("application/json") ? res.json() : res.text();
}

export const health = () => apiGet("/health");
export const ping = () => apiGet("/ping");
export const version = () => apiGet("/api/version");
