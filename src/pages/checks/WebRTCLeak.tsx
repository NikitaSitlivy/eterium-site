import React, { useEffect, useState } from "react";

export default function WebRTCLeak() {
  const [candidates, setCandidates] = useState<string[]>([]);
  const [leak, setLeak] = useState<null | "host" | "srflx" | "relay" | "none">(null);

  useEffect(() => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: "stun:stun.l.google.com:19302" }] });
    pc.createDataChannel("t");
    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      const c = e.candidate.candidate;
      setCandidates((p) => [...p, c]);
      if (/ typ host /.test(c)) setLeak((l) => l ?? "host");
      else if (/ typ srflx /.test(c)) setLeak((l) => l ?? "srflx");
      else if (/ typ relay /.test(c)) setLeak((l) => l ?? "relay");
    };
    pc.createOffer().then((o) => pc.setLocalDescription(o));
    return () => pc.close();
  }, []);

  const verdict =
    leak === "host" ? "⚠️ Local network visible (host ICE) — possible leak"
    : leak === "srflx" ? "ℹ️ External address visible via STUN (srflx)"
    : leak === "relay" ? "✅ Using relay/TURN (IP hidden)"
    : "⌛ Collecting ICE candidates…";

  return (
    <main style={{maxWidth:900,margin:"24px auto",padding:"0 16px"}}>
      <h1>WebRTC IP Leak Test</h1>
      <p>{verdict}</p>
      <details><summary>Show ICE Candidates</summary>
        <pre style={{whiteSpace:"pre-wrap"}}>{candidates.join("\n")}</pre>
      </details>
    </main>
  );
}
