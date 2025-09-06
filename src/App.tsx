import React, { useEffect, useMemo, useState } from "react";
import Card from "./components/Card";
import { collectEnv } from "./collect/env";
import { collectScreen } from "./collect/screen";
import { collectStorage } from "./collect/storage";
import { collectWebGL } from "./collect/webgl";
import { runCanvas } from "./collect/canvas";
import { runRTC } from "./collect/rtc";
import { collectPerms } from "./collect/perms";
import { collectWebGPU } from "./collect/webgpu";
import { collectMediaCapabilities } from "./collect/mediacap";
import { collectWebAuthn } from "./collect/webauthn";
import { collectCSSCapabilities } from "./collect/csscap";
import { collectBattery } from "./collect/battery";
import { collectSensors } from "./collect/sensors";
import { collectNetwork } from "./collect/network";
import { runFPJS } from "./integrations/fpjs";
import "./styles.css";

/* ---------- Header bits ---------- */

const Logo: React.FC = () => (
  <div className="logo-badge" aria-hidden>
    <svg width="22" height="22" viewBox="0 0 24 24" role="img" aria-label="FingerCloak">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#25e089" />
          <stop offset="100%" stopColor="#17b46a" />
        </linearGradient>
      </defs>
      <path d="M12 2.5c3.6 1.5 6.3 1 9.5 0v7.8c0 5.1-3.9 8.9-9.5 11.2C6.4 19.2 2.5 15.4 2.5 10.3V2.5c3.2 1 5.9 1.5 9.5 0Z" fill="url(#g)" opacity=".18"/>
      <path d="M7.5 8.2h6.5M7.5 12.2h4" stroke="#25e089" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  </div>
);

const HeroViz: React.FC<{ env?: any; screen?: any }> = ({ env, screen }) => {
  const os = env?.uaData?.platform ?? env?.platform ?? "—";
  const browser =
    (env?.ua || "").match(/(Chrome|Firefox|Safari|Edge)\/[\d.]+/g)?.[0] ??
    (env?.ua || "").match(/(Chromium)\/[\d.]+/g)?.[0] ?? "—";
  const device = env?.uaData?.mobile || /iPhone|iPad|Android/i.test(env?.ua || "") ? "Mobile" : "Desktop";

  return (
    <div className="hero-viz" aria-label="Your environment">
      <div className="hero-scan" />
      <div className="hero-header">
        <div className="hero-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <rect x="5" y="2.5" width="14" height="19" rx="2.5" stroke="#25e089" fill="none"/>
            <rect x="7.7" y="5.6" width="8.6" height="11.8" rx="1.4" fill="#0b1a17" stroke="#1a5c4c"/>
            <circle cx="12" cy="19" r="1" fill="#25e089"/>
          </svg>
        </div>
        <div>Your environment</div>
      </div>
      <div className="hero-grid">
        <div className="dim">Device</div><div style={{fontWeight:700}}>{device}</div>
        <div className="dim">Browser</div><div>{browser}</div>

        <div className="dim">OS</div><div style={{fontWeight:700}}>{os}</div>
        <div className="dim">Languages</div><div>{env?.languages?.join(", ") || "—"}</div>

        <div className="dim">Timezone</div><div style={{fontWeight:700}}>{env?.timezone || "—"}</div>
        <div className="dim">DPR</div><div>{screen?.dpr ?? "—"}</div>

        <div className="dim">Screen</div><div>{screen?.screen ?? "—"}</div>
        <div className="dim">Inner</div><div>{screen?.inner ?? "—"}</div>
      </div>
    </div>
  );
};

/* ---------- Quick Links (magnet pages) ---------- */

const LinkPill: React.FC<{ href: string; label: string; title?: string; icon?: React.ReactNode }> = ({ href, label, title, icon }) => (
  <a
    href={href}
    title={title || label}
    style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      background: "linear-gradient(180deg,#0f1a2b,#0c1322)",
      border: "1px solid #1b2c50",
      padding: "8px 12px", borderRadius: 12, textDecoration: "none",
      color: "var(--text)", fontWeight: 600, boxShadow: "0 6px 18px #0006"
    }}
  >
    <span aria-hidden="true">{icon}</span>
    <span>{label}</span>
  </a>
);

const QuickLinks: React.FC = () => (
  <nav aria-label="Quick tools"
       style={{maxWidth:1100, margin:"18px auto 6px", padding:"0 16px"}}>
    <div style={{display:"flex", flexWrap:"wrap", gap: 10}}>
      <LinkPill href="/check/webrtc-ip-leak" label="WebRTC IP check"
        icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M3 12h18M12 3v18" stroke="#38e8ff" strokeWidth="2" /></svg>} />
      <LinkPill href="/check/canvas-fingerprint" label="Canvas/WebGL hash"
        icon={<svg width="16" height="16" viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="12" rx="2" stroke="#38e8ff" strokeWidth="2"/></svg>} />
      <LinkPill href="/docs/playwright-adapter" label="Playwright adapter"
        icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M5 19l14-14" stroke="#38e8ff" strokeWidth="2"/></svg>} />
      <LinkPill href="/docs/puppeteer-adapter" label="Puppeteer adapter"
        icon={<svg width="16" height="16" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7" stroke="#38e8ff" strokeWidth="2"/></svg>} />
      <LinkPill href="/faq" label="FAQ"
        icon={<svg width="16" height="16" viewBox="0 0 24 24"><path d="M9 9a3 3 0 016 0c0 3-3 2-3 5M12 17h.01" stroke="#38e8ff" strokeWidth="2" strokeLinecap="round"/></svg>} />
    </div>
  </nav>
);

/* ---------- App ---------- */

// Build a full report object even for not-yet-collected sections
function buildFullReport(state: any) {
  const notCollected = (extra: Record<string, any> = {}) => ({ status: "not_collected", ...extra });

  return {
    meta: {
      when: new Date().toISOString(),
      page: typeof location !== "undefined" ? location.href : "",
      app: "FingerCloak Lab"
    },

    // Collected on load
    env: state.env ?? notCollected(),
    screen: state.screen ?? notCollected(),
    storage: state.storage ?? notCollected(),
    webgl: state.webgl ?? notCollected({ supported: "unknown" }),
    perms: state.perms ?? notCollected(),
    network: state.network ?? notCollected({ supported: "unknown" }),
    csscap: state.csscap ?? notCollected(),

    // On-demand sections
    webgpu: state.webgpu ?? notCollected({ supported: "unknown" }),
    mediacap: state.mediacap ?? notCollected({ supported: "unknown" }),
    webauthn: state.webauthn ?? notCollected({ supported: "unknown" }),
    battery: state.battery ?? notCollected({ supported: "unknown" }),
    sensors: state.sensors ?? notCollected(),

    canvas: state.canvas ?? notCollected({ hash: null, size: null }),
    rtc: state.rtc ?? notCollected({ candidates: [], publicIPs: [], privateIPs: [], types: [] }),
    fpjs: state.fpjs ?? notCollected({ visitorId: null, conf: null, componentsCount: 0, components: {} }),
  };
}

type State = {
  env?: any; screen?: any; storage?: any; webgl?: any; canvas?: any; rtc?: any; perms?: any;
  webgpu?: any; mediacap?: any; webauthn?: any; csscap?: any; battery?: any; sensors?: any; network?: any;
  fpjs?: any;
};

export default function App() {
  const [state, setState] = useState<State>({});
  const now = useMemo(() => new Date(), []);

  useEffect(() => {
    (async () => {
      const env = await collectEnv();
      const screen = await collectScreen();
      const storage = await collectStorage();
      const webgl = collectWebGL();
      const perms = await collectPerms();
      const network = collectNetwork();
      const csscap = collectCSSCapabilities();
      setState(s => ({ ...s, env, screen, storage, webgl, perms, network, csscap }));
    })();
  }, []);

  const copyReport = async () => {
    const report = buildFullReport(state);
    const text = JSON.stringify(report, null, 2);
    await navigator.clipboard.writeText(text);
    // toast
    const t = document.createElement("div");
    t.textContent = "Report copied — all sections included";
    Object.assign(t.style, {
      position: "fixed", bottom: "22px", left: "50%", transform: "translateX(-50%)",
      background: "#0b1c1a", border: "1px solid #14453b", color: "var(--text)",
      padding: "10px 14px", borderRadius: "12px", boxShadow: "0 12px 40px #000a", zIndex: "9999"
    });
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 1600);
  };

  return (
    <div className="wrap">
      <header className="header">
        <Logo />
        <div>
          <div className="title-wrap" aria-label="FingerCloak Lab">
            <div className="title-scan" />
            <h1 className="title"><span className="brand">FingerCloak</span> <span className="accent">Lab</span></h1>
            <div className="title-underline" />
          </div>
          <div className="sub">We show what a site can learn about you right now — locally, with no installs.</div>
          <HeroViz env={state.env} screen={state.screen} />
        </div>
      </header>

      {/* Quick links to tools/docs */}
      <QuickLinks />

      <div className="grid">
        {/* Status */}
        <Card title="Status">
          <div className="inner">
            <div className="pills">
              <span className="pill"><span className="dot" /> WebRTC not started</span>
              <span className="pill"><span className="dot" /> Canvas not started</span>
            </div>
            <div className="kv">
              <div className="dim">Page</div><div>{location.href}</div>
              <div className="dim">Time</div><div>{now.toISOString().replace("T"," ").replace("Z"," UTC")}</div>
            </div>
            <div className="hr"></div>
            <div className="pills" style={{ margin: 0 }}>
              <button className="btn" onClick={copyReport}>Copy full report</button>
            </div>
          </div>
        </Card>

        {/* Environment */}
        <Card title="Browser environment">
          <div className="inner">
            <div className="kv">
              <div className="dim">UA</div>
              <div>{(state.env?.ua || "").slice(0,140)}{(state.env?.ua?.length||0)>140 ? "…" : ""}</div>

              <div className="dim">UA platform</div><div>{state.env?.uaData?.platform ?? state.env?.platform ?? "—"}</div>
              <div className="dim">UA version</div><div>{state.env?.uaData?.uaFullVersion ?? "—"}</div>
              <div className="dim">Mobile</div><div>{String(state.env?.uaData?.mobile ?? false)}</div>
              <div className="dim">Languages</div><div>{state.env?.languages?.join(", ")}</div>
              <div className="dim">Timezone</div><div>{state.env?.timezone}</div>
              <div className="dim">Hardware threads</div><div>{state.env?.hardwareConcurrency}</div>
              <div className="dim">Device memory (GB)</div><div>{state.env?.deviceMemory}</div>
              <div className="dim">Do Not Track</div><div>{String(state.env?.doNotTrack)}</div>
              <div className="dim">Cookies enabled</div><div>{String(state.env?.cookiesEnabled)}</div>
            </div>
            <div className="hr"></div>
            <pre className="pre">{JSON.stringify(state.env ?? "—", null, 2)}</pre>
          </div>
        </Card>

        {/* Screen & Storage */}
        <Card title="Screen & storage">
          <div className="inner">
            <div className="kv">
              {Object.entries(state.screen || {}).map(([k,v])=>(
                <React.Fragment key={k}><div className="dim">{k}</div><div>{String(v)}</div></React.Fragment>
              ))}
            </div>
            <div className="hr"></div>
            <div className="kv">
              {Object.entries(state.storage || {}).map(([k,v])=>(
                <React.Fragment key={k}><div className="dim">{k}</div><div>{String(v)}</div></React.Fragment>
              ))}
            </div>
          </div>
        </Card>

        {/* Network */}
        <Card title="Network (Network Information)">
          <div className="inner">
            <pre className="pre">{JSON.stringify(state.network ?? {supported:false}, null, 2)}</pre>
          </div>
        </Card>

        {/* WebGL */}
        <Card title="WebGL / GPU">
          <div className="inner">
            <div className="kv">
              <div className="dim">Vendor</div><div>{state.webgl?.vendor}</div>
              <div className="dim">Renderer</div><div>{state.webgl?.renderer}</div>
              <div className="dim">GL version</div><div>{state.webgl?.version}</div>
              <div className="dim">GLSL</div><div>{state.webgl?.glsl}</div>
              <div className="dim">Max texture</div><div>{state.webgl?.maxTexture}</div>
              <div className="dim">Max attribs</div><div>{state.webgl?.maxAttribs}</div>
              <div className="dim">Ext (first 25)</div><div>{state.webgl?.extensionsFirst25?.length ?? 0}</div>
            </div>
            <div className="hr"></div>
            <pre className="pre">{JSON.stringify(state.webgl ?? "—", null, 2)}</pre>
          </div>
        </Card>

        {/* WebGPU */}
        <Card title="WebGPU (capabilities)">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const webgpu = await collectWebGPU();
                setState(s => ({ ...s, webgpu }));
              }}>
                Collect WebGPU
              </button>
            </div>
            <pre className="pre">{JSON.stringify(state.webgpu ?? { supported:false }, null, 2)}</pre>
          </div>
        </Card>

        {/* MediaCapabilities */}
        <Card title="Media capabilities (codec/HDR)">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const mediacap = await collectMediaCapabilities();
                setState(s => ({ ...s, mediacap }));
              }}>
                Check codecs
              </button>
            </div>
            <pre className="pre">{JSON.stringify(state.mediacap ?? { supported:false }, null, 2)}</pre>
          </div>
        </Card>

        {/* CSS/Display */}
        <Card title="CSS / Display capabilities">
          <div className="inner">
            <pre className="pre">{JSON.stringify(state.csscap ?? {}, null, 2)}</pre>
          </div>
        </Card>

        {/* WebAuthn */}
        <Card title="WebAuthn (platform authenticator)">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const webauthn = await collectWebAuthn();
                setState(s => ({ ...s, webauthn }));
              }}>
                Check WebAuthn
              </button>
            </div>
            <pre className="pre">{JSON.stringify(state.webauthn ?? { supported:false }, null, 2)}</pre>
          </div>
        </Card>

        {/* Battery */}
        <Card title="Battery (where supported)">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const battery = await collectBattery();
                setState(s => ({ ...s, battery }));
              }}>
                Read Battery API
              </button>
            </div>
            <pre className="pre">{JSON.stringify(state.battery ?? { supported:false }, null, 2)}</pre>
          </div>
        </Card>

        {/* Sensors */}
        <Card title="Sensors & permissions">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const sensors = await collectSensors();
                setState(s => ({ ...s, sensors }));
              }}>
                Check sensors
              </button>
            </div>
            <pre className="pre">{JSON.stringify(state.sensors ?? {}, null, 2)}</pre>
          </div>
        </Card>

        {/* Canvas */}
        <Card title="Canvas fingerprint">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const res = await runCanvas();
                setState(s => ({ ...s, canvas: res }));
              }}>
                Run Canvas hash
              </button>
            </div>
            <div className="kv">
              <div className="dim">Hash</div><div>{state.canvas?.hash ?? "—"}</div>
              <div className="dim">Size</div><div>{state.canvas ? `${state.canvas.w}×${state.canvas.h}` : "—"}</div>
            </div>
          </div>
        </Card>

        {/* WebRTC */}
        <Card title="WebRTC">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const res = await runRTC();
                setState(s => ({ ...s, rtc: res }));
              }}>
                Check ICE candidates (IP leaks)
              </button>
            </div>
            <div className="kv">
              <div className="dim">Candidates found</div><div>{state.rtc?.candidates?.length ?? 0}</div>
              <div className="dim">Private addresses</div><div>{state.rtc?.privateIPs?.length ? state.rtc.privateIPs.join(", ") : "—"}</div>
              <div className="dim">Public addresses</div><div>{state.rtc?.publicIPs?.length ? state.rtc.publicIPs.join(", ") : "—"}</div>
              <div className="dim">Types</div><div>{state.rtc?.types?.length ? state.rtc.types.join(", ") : "—"}</div>
            </div>
            <div className="hr"></div>
            <pre className="pre">{(state.rtc?.candidates || []).join("\n") || "—"}</pre>
          </div>
        </Card>

        {/* FingerprintJS (OSS) */}
        <Card title="FingerprintJS (open-source)">
          <div className="inner">
            <div className="pills" style={{ marginBottom: 10 }}>
              <button className="btn" onClick={async ()=>{
                const fpjs = await runFPJS();
                setState(s => ({ ...s, fpjs }));
              }}>
                Collect FingerprintJS
              </button>
            </div>
            <div className="kv">
              <div className="dim">visitorId</div><div style={{wordBreak:"break-all"}}>{state.fpjs?.visitorId ?? "—"}</div>
              <div className="dim">confidence</div><div>{state.fpjs?.conf ?? "—"}</div>
              <div className="dim">components</div><div>{state.fpjs?.componentsCount ?? 0}</div>
            </div>
            <div className="hr"></div>
            <pre className="pre">{JSON.stringify(state.fpjs?.components ?? {}, null, 2)}</pre>
          </div>
        </Card>
      </div>

      <div className="footer">
        © {new Date().getFullYear()} FingerCloak Lab. Data is shown locally in your browser; we do not send it anywhere.
      </div>
    </div>
  );
}
