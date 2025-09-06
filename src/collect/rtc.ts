export type RTCInfo = {
  candidates: string[];
  publicIPs: string[];
  privateIPs: string[];
  types: string[];
};

const isPrivateV4 = (ip: string) =>
  /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(ip);

const isPrivateV6 = (ip: string) =>
  /^::1$|^fe80:|^fc|^fd/i.test(ip); // loopback, link-local, unique-local

const isDiscardIP = (ip: string) =>
  ip === "0.0.0.0" || ip === "127.0.0.1" || ip === "::" || ip === "::1";

const isIP = (s: string) => {
  // очень простой валидатор: либо IPv4, либо похоже на IPv6
  if (/^\d+\.\d+\.\d+\.\d+$/.test(s)) return true;        // v4
  if (/^[0-9a-f:]+$/i.test(s) && s.includes(":")) return true; // v6
  return false;
};

export async function runRTC(): Promise<RTCInfo> {
  const lines: string[] = [];
  const pub = new Set<string>(), priv = new Set<string>(), types = new Set<string>();
  let pc: RTCPeerConnection | null = null;

  try {
    pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.createDataChannel("fc");

pc.onicecandidate = ev => {
  if (!ev.candidate) return;
  const s = ev.candidate.candidate;
  lines.push(s);

  // 1) typ вытаскиваем всегда (даже если адрес — mDNS)
  const typeMatch = s.match(/\styp\s+(\w+)/);
  if (typeMatch) types.add(typeMatch[1]);

  // 2) адрес: foundation comp proto PRIORITY ADDRESS PORT ...
  //    Берём «address» как любой токен, дальше сами валидируем как IP (v4/v6).
  const m = s.match(/candidate:\S+\s+\d+\s+\w+\s+\d+\s+([^\s]+)\s+(\d+)/);
  if (!m) return;

  const addr = m[1];
  // mDNS host (xxx.local) нам не подходит — пропускаем
  if (!/^[0-9a-f:.]+$/i.test(addr)) return;

  // фильтры
  const isDiscard = addr === "0.0.0.0" || addr === "127.0.0.1" || addr === "::" || addr === "::1";
  if (isDiscard) return;

  const isV6 = addr.includes(":");
  const isPrivV4 = /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.|169\.254\.)/.test(addr);
  const isPrivV6 = /^::1$|^fe80:|^fc|^fd/i.test(addr);

  (isV6 ? (isPrivV6 ? priv : pub) : (isPrivV4 ? priv : pub)).add(addr);
};


    const offer = await pc.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await pc.setLocalDescription(offer);

    await new Promise<void>(resolve => {
      const t = setTimeout(resolve, 2500);
      pc!.onicegatheringstatechange = () => {
        if (pc!.iceGatheringState === "complete") { clearTimeout(t); resolve(); }
      };
    });
  } finally {
    try { pc?.close(); } catch {}
  }

  return {
    candidates: lines,
    publicIPs: [...pub],
    privateIPs: [...priv],
    types: [...types],
  };
}
