// collect/env.ts
export type EnvInfo = {
  ua: string;
  uaData?: any;
  languages?: readonly string[];
  timezone?: string;
  /** Новое: смещение локального времени относительно UTC, в минутах. Пример: +120 летом для Europe/Amsterdam */
  timezoneOffsetMinutes?: number;
  /** Новое: отформатированная строка смещения, например "+02:00" */
  utcOffset?: string;

  platform?: string | null;
  hardwareConcurrency?: number | null;
  deviceMemory?: number | null;
  doNotTrack?: string | null;
  cookiesEnabled?: boolean | null;
};

function formatOffset(mins: number) {
  const sign = mins >= 0 ? "+" : "-";
  const abs = Math.abs(mins);
  const hh = String(Math.trunc(abs / 60)).padStart(2, "0");
  const mm = String(abs % 60).padStart(2, "0");
  return `${sign}${hh}:${mm}`;
}

export async function collectEnv(): Promise<EnvInfo> {
  const ua = navigator.userAgent;
  let uaData: any = null;
  try {
    if ((navigator as any).userAgentData?.getHighEntropyValues) {
      uaData = await (navigator as any).userAgentData.getHighEntropyValues([
        "architecture","bitness","platform","platformVersion","uaFullVersion","fullVersionList","model","mobile"
      ]);
    }
  } catch (e) {
    uaData = { error: String(e) };
  }

  const now = new Date();
  // В JS getTimezoneOffset() даёт минуты, которые надо ДОБАВИТЬ к локальному, чтобы получить UTC (обратный знак).
  // Для удобства инвертируем, чтобы Europe/Amsterdam летом был +120.
  const offsetMinutes = -now.getTimezoneOffset();

  return {
    ua,
    uaData,
    languages: navigator.languages,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffsetMinutes: offsetMinutes,
    utcOffset: formatOffset(offsetMinutes),

    platform: (navigator as any).platform ?? null,
    hardwareConcurrency: (navigator as any).hardwareConcurrency ?? null,
    deviceMemory: (navigator as any).deviceMemory ?? null,
    doNotTrack: (navigator as any).doNotTrack ?? null,
    cookiesEnabled: (navigator as any).cookieEnabled ?? null,
  };
}
