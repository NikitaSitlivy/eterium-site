// минимальные типы для clientjs
declare module 'clientjs' {
  export class ClientJS {
    getFingerprint(): number;
    getBrowser(): string;
    getBrowserVersion(): string;
    getOS(): string;
    getOSVersion(): string;
    getDevice(): string;
    getCurrentResolution(): string | number[] | null;
    getAvailableResolution(): string | number[] | null;
    isMobile(): boolean;
    isCanvas(): boolean;
    isWebGL(): boolean;
    getCanvasPrint(): any;
    getWebGLVendor(): string | null;
    getWebGLRenderer(): string | null;
    getUserAgent(): string;
    getTimezone(): string | null;
    getLanguage(): string | null;
    getSystemLanguage(): string | null;
    getPlugins(): any[];
  }
  const _default: { ClientJS: typeof ClientJS };
  export default _default;
}
