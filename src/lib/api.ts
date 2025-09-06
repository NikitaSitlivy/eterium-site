// src/lib/api.ts
// Базовый URL берём из .env, иначе — из window.__API_BASE__, иначе — Render API.
const API_BASE: string =
  (import.meta as any).env?.VITE_API_URL ||
  (typeof window !== "undefined" && (window as any).__API_BASE__) ||
  "https://eterium-api.onrender.com";

// Общая обёртка с таймаутом и нормальной ошибкой
async function http(
  path: string,
  init: RequestInit & { timeoutMs?: number } = {}
) {
  const url = `${API_BASE}${path}`;
  const { timeoutMs = 15000, ...rest } = init;

  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      // backend не использует куки — не шлём их
      credentials: "omit",
      signal: ctrl.signal,
      ...rest,
    });

    const ct = res.headers.get("content-type") || "";
    const isJSON = ct.includes("application/json");
    const body = isJSON ? await res.json() : await res.text();

    if (!res.ok) {
      const msg = isJSON ? body?.error || JSON.stringify(body) : body;
      throw new Error(`[${res.status}] ${res.statusText} — ${msg ?? "request failed"}`);
    }
    return body;
  } finally {
    clearTimeout(t);
  }
}

/* ======= Публичные утилиты ======= */

export const health = () => http("/health");
export const ping = () => http("/ping");
export const version = () => http("/api/version");

/* ======= Fingerprint API ======= */

export type CollectResponse = {
  ok: boolean;
  id?: string;
  hash?: string;
  nonzero?: boolean;
  ts?: number;
  error?: string;
};

export const fpCollect = (payload: any): Promise<CollectResponse> =>
  http("/api/fp/collect", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ payload }),
  });

export const fpGet = (id: string) =>
  http(`/api/fp/${encodeURIComponent(id)}`);

export type CompareResponse = {
  ok: boolean;
  aId?: string;
  bId?: string;
  aHash?: string;
  bHash?: string;
  sameHash?: boolean;
  similarity?: number; // 0..1
  delta?: Array<{ path: string; a: any; b: any }>;
  error?: string;
};

export const fpCompare = (a: string, b: string): Promise<CompareResponse> =>
  http(`/api/fp/compare?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`);

/* ======= IndexNow proxy (по желанию с фронта) ======= */

export const indexNowNotify = (urls: string[] | string) =>
  http("/api/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      Array.isArray(urls) ? { urls } : { url: urls }
    ),
  });

/* ======= Экспорт базового URL на всякий ======= */
export { API_BASE };
