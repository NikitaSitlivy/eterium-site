// ————— Типы
export type ClientJsCollected = {
  status: "collected";
  fingerprint: number | null;

  ua: string | null;
  browser: string | null;
  browserVersion: string | null;
  engine: string | null;
  engineVersion: string | null;

  os: string | null;
  osVersion: string | null;

  device?: string | null;               // устаревшее поле clientjs — опционально
  deviceType: string | null;
  deviceVendor: string | null;

  isMobile: boolean | null;
  isTablet: boolean | null;
  isDesktop: boolean | null;

  currentRes: string | null;            // "WxH"
  availRes: string | null;              // "WxH"
  colorDepth: number | null;
  dpr: number | null;

  timezone: string | number | null;     // что вернёт clientjs.getTimezone()
  timezoneName: string | null;          // IANA, из Intl
  language: string | null;
  systemLanguage: string | null;
  languages: string[] | null;

  plugins: string | null;
  mimeTypes: string | null;
  cookiesEnabled: boolean | null;
  doNotTrack: string | boolean | null;

  isCanvas: boolean | null;
  isWebGL: boolean | null;
  canvasHash: string | null;            // хэш от dataURL (PNG байты)
  webglVendor: string | null;
  webglRenderer: string | null;

  screenPrint: string | null;
};

export type ClientJsError = { status: "error"; error: string };
export type ClientJsReport = ClientJsCollected | ClientJsError;

export type ClientJsDebugRaw =
  | { status: "collected"; canvasPrint: string | null }
  | { status: "error"; error: string };

// ————— helpers
const safe = <T>(fn: () => T, def: any = null): T | null => {
  try { return fn(); } catch { return def; }
};

function toResString(v: unknown): string | null {
  if (Array.isArray(v) && v.length >= 2 && Number.isFinite(v[0]) && Number.isFinite(v[1])) {
    return `${v[0]}x${v[1]}`;
  }
  if (typeof v === "string" && v.includes("x")) return v;
  return null;
}

function detectWebGLFallback(): { webglVendor?: string; webglRenderer?: string; isWebGL?: boolean } {
  try {
    const c = document.createElement("canvas");
    const gl: any = c.getContext("webgl") || c.getContext("experimental-webgl");
    if (!gl) return { isWebGL: false };
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const webglVendor = dbg ? gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
    const webglRenderer = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return { isWebGL: true, webglVendor, webglRenderer };
  } catch {
    return { isWebGL: null as any };
  }
}

async function sha256OfDataURL(dataURL: string): Promise<string> {
  const comma = dataURL.indexOf(",");
  const b64 = comma >= 0 ? dataURL.slice(comma + 1) : dataURL;
  const bin = atob(b64);
  const buf = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("");
}

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: any;
  try {
    return await Promise.race([
      p,
      new Promise<never>((_, rej) => (t = setTimeout(() => rej(new Error(`ClientJS timeout ${ms}ms`)), ms))),
    ]);
  } finally {
    clearTimeout(t);
  }
}

// ————— core
export async function runClientJS(): Promise<ClientJsReport> {
  try {
    const mod: any = await import("clientjs");
    const ClientCtor = mod.ClientJS ?? mod.default ?? mod;
    const client: any = new ClientCtor();

    // Идентификаторы / UA / движок
    const fingerprint = safe(() => client.getFingerprint());
    const ua = safe(() => client.getUserAgent());
    const browser = safe(() => client.getBrowser());
    const browserVersion = safe(() => client.getBrowserVersion());
    const engine = safe(() => client.getEngine?.());
    const engineVersion = safe(() => client.getEngineVersion?.());

    // ОС / устройство
    const os = safe(() => client.getOS());
    const osVersion = safe(() => client.getOSVersion());
    const device = safe(() => client.getDevice?.());
    const deviceType = safe(() => client.getDeviceType?.());
    const deviceVendor = safe(() => client.getDeviceVendor?.());
    const isMobile = safe(() => client.isMobile?.());
    const isTablet = safe(() => client.isTablet?.());
    const isDesktop = (isMobile === false && isTablet === false) ? true : null;

    // Экран
    const currentRes = toResString(safe(() => client.getCurrentResolution()));
    const availRes = toResString(safe(() => client.getAvailableResolution()));
    const colorDepth = safe(() => client.getColorDepth?.());
    const dpr = safe(() => (window.devicePixelRatio ?? null));

    // Локаль / часовой пояс
    const tzRaw = safe(() => client.getTimezone());
    const timezoneName = safe(() => Intl.DateTimeFormat().resolvedOptions().timeZone ?? null);
    const timezone = tzRaw ?? timezoneName ?? null;

    const language = safe(() => client.getLanguage());
    const systemLanguage = safe(() => client.getSystemLanguage());
    const languages = safe(() => (navigator.languages as any) ?? null);

    // Плагины / MIME / куки / DNT
    const plugins = safe(() => client.getPlugins());
    const mimeTypes = safe(() => client.getMimeTypes?.());
    const cookiesEnabled = safe(() => client.isCookie?.());
    const doNotTrack = safe(() => client.getDoNotTrack?.());

    // Canvas (хеш вместо dataURL)
    const canvasPrint: string | null = safe(() => client.getCanvasPrint());
    const canvasHash = canvasPrint ? await sha256OfDataURL(canvasPrint) : null;
    const isCanvas = safe(() => client.isCanvas());

    // WebGL (+fallback)
    let isWebGL = safe(() => client.isWebGL());
    let webglVendor = safe(() => client.getWebGLVendor?.());
    let webglRenderer = safe(() => client.getWebGLRenderer?.());
    if (isWebGL == null || webglVendor == null || webglRenderer == null) {
      const fb = detectWebGLFallback();
      if (isWebGL == null) isWebGL = (fb.isWebGL as any) ?? null;
      if (webglVendor == null) webglVendor = (fb.webglVendor as any) ?? null;
      if (webglRenderer == null) webglRenderer = (fb.webglRenderer as any) ?? null;
    }

    // Доп. «отпечаток экрана» clientjs
    const screenPrint = safe(() => client.getScreenPrint?.());

    const res: ClientJsCollected = {
      status: "collected",
      fingerprint,

      ua, browser, browserVersion, engine, engineVersion,
      os, osVersion, device, deviceType, deviceVendor,
      isMobile, isTablet, isDesktop,

      currentRes, availRes, colorDepth, dpr,

      timezone, timezoneName, language, systemLanguage, languages,
      plugins, mimeTypes, cookiesEnabled, doNotTrack,

      isCanvas, isWebGL, canvasHash, webglVendor, webglRenderer,
      screenPrint,
    };
    return res;
  } catch (e: any) {
    return { status: "error", error: String(e?.message || e) };
  }
}

// Лёгкий сбор — для Copy full report
export async function collectClientjsForReport(timeoutMs = 4000): Promise<ClientJsReport> {
  try {
    return await withTimeout(runClientJS(), timeoutMs);
  } catch (e: any) {
    return { status: "error", error: String(e?.message ?? e) };
  }
}

// Debug: только сырые тяжёлые данные (то, что в основном отчёте заменяем хэшем)
export async function collectClientjsRawForDebug(timeoutMs = 4000): Promise<ClientJsDebugRaw> {
  try {
    const p = (async () => {
      const mod: any = await import("clientjs");
      const ClientCtor = mod.ClientJS ?? mod.default ?? mod;
      const client: any = new ClientCtor();
      const canvasPrint: string | null = safe(() => client.getCanvasPrint());
      return { status: "collected", canvasPrint } as const;
    })();
    return await withTimeout(p, timeoutMs);
  } catch (e: any) {
    return { status: "error", error: String(e?.message ?? e) };
  }
}
