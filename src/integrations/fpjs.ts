// integrations/fpjs.ts

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
  for (const [k, v] of Object.entries(result.components as any)) {
    components[k] = (v as any).value;
  }

  return {
    visitorId: result.visitorId ?? null,
    conf: (result as any)?.confidence?.score ?? null,
    componentsCount: Object.keys(components).length,
    components
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

// Неблокирующий сбор FPJS с таймаутом — удобно вызывать внутри Copy full report
export async function collectFpjsForReport(timeoutMs = 4000): Promise<FpjsReport> {
  try {
    const res = await withTimeout(runFPJS(), timeoutMs);
    return {
      status: "collected",
      visitorId: res.visitorId,
      conf: res.conf,
      componentsCount: res.componentsCount,
      components: res.components
    };
  } catch (e: any) {
    return {
      status: "error",
      visitorId: null,
      conf: null,
      componentsCount: 0,
      components: {},
      error: String(e?.message ?? e)
    };
  }
}

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
