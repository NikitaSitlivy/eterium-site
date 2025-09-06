export type FpjsRaw = {
  visitorId: string | null;
  conf: number | null;
  componentsCount: number;
  components: Record<string, unknown>;
};

export async function runFPJS(): Promise<FpjsRaw> {
  const { default: FingerprintJS } = await import("@fingerprintjs/fingerprintjs");
  const fp = await FingerprintJS.load();
  const result = await fp.get();

  const components: Record<string, unknown> = {};
  for (const [k, v] of Object.entries((result as any).components || {})) {
    components[k] = (v as any).value; // распакованные value
  }

  return {
    visitorId: (result as any).visitorId ?? null,
    conf: (result as any)?.confidence?.score ?? null,
    componentsCount: Object.keys(components).length,
    components,
  };
}

export type FpjsReport =
  | {
      status: "collected";
      visitorId: string | null;
      conf: number | null;
      componentsCount: number;
      components: Record<string, unknown>;
    }
  | {
      status: "error";
      visitorId: null;
      conf: null;
      componentsCount: 0;
      components: Record<string, unknown>;
      error: string;
    };

// ---- helpers
async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: any;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) =>
        (t = setTimeout(() => rej(new Error(`FingerprintJS timeout ${ms}ms`)), ms))
      )
    ]);
  } finally {
    clearTimeout(t);
  }
}

// hash(UTF-8 строки)
async function sha256OfString(s: string): Promise<string> {
  const bytes = new TextEncoder().encode(s);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// hash(dataURL → байты PNG)
async function sha256OfDataURL(dataURL: string): Promise<string> {
  const comma = dataURL.indexOf(",");
  const b64 = comma >= 0 ? dataURL.slice(comma + 1) : dataURL;
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// безопасный хеш: dataURL → PNG-байты; объект/массив → JSON; остальное → строка
async function smartHash(v: any): Promise<string> {
  if (typeof v === "string" && v.startsWith("data:")) return sha256OfDataURL(v);
  const s = (v && typeof v === "object") ? JSON.stringify(v) : String(v);
  return sha256OfString(s);
}

// ---- лёгкий сбор FPJS для full report (заменяем geometry/text на хеши)
export async function collectFpjsForReport(timeoutMs = 4000): Promise<FpjsReport> {
  try {
    const res = await withTimeout(runFPJS(), timeoutMs);

    const components: Record<string, unknown> = { ...res.components };
    const canvas: any = components["canvas"] ?? null;

    if (canvas && (canvas.geometry != null || canvas.text != null)) {
      const geometryHash = canvas.geometry != null ? await smartHash(canvas.geometry) : null;
      const textHash = canvas.text != null ? await smartHash(canvas.text) : null;

      components["canvas"] = {
        ...canvas,
        geometryHash,
        textHash,
      };
      delete (components["canvas"] as any).geometry;
      delete (components["canvas"] as any).text;
    }

    return {
      status: "collected",
      visitorId: res.visitorId,
      conf: res.conf,
      componentsCount: res.componentsCount,
      components,
    };
  } catch (e: any) {
    return {
      status: "error",
      visitorId: null,
      conf: null,
      componentsCount: 0,
      components: {},
      error: String(e?.message ?? e),
    };
  }
}

// ---- Debug: только сырые тяжёлые данные (то, что в основном отчёте заменяем хешами)
export type FpjsDebugRaw =
  | { status: "collected"; canvas: { geometry: string | null; text: string | null } }
  | { status: "error"; error: string; canvas: { geometry: null; text: null } };

export async function collectFpjsRawForDebug(timeoutMs = 4000): Promise<FpjsDebugRaw> {
  try {
    const res = await withTimeout(runFPJS(), timeoutMs);
    const canvas = (res.components?.["canvas"] as any) ?? {};
    return {
      status: "collected",
      canvas: {
        geometry: (canvas?.geometry as any) ?? null,
        text: (canvas?.text as any) ?? null,
      },
    };
  } catch (e: any) {
    return {
      status: "error",
      error: String(e?.message ?? e),
      canvas: { geometry: null, text: null },
    };
  }
}
