import React, { useEffect, useRef, useState } from "react";

function hash(str: string) {
  let h = 0n;
  for (let i = 0; i < str.length; i++) h = (h * 131n + BigInt(str.charCodeAt(i))) & 0xffffffffffffffffn;
  return h.toString(16).padStart(16, "0");
}

export default function CanvasFingerprint() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [fp, setFp] = useState("");

  useEffect(() => {
    const c = ref.current!;
    c.width = 280; c.height = 80;
    const ctx = c.getContext("2d")!;
    ctx.textBaseline = "top";
    ctx.font = '16px "Segoe UI", Arial, system-ui, sans-serif';
    ctx.fillStyle = "#222"; ctx.fillRect(0, 0, 280, 80);
    ctx.fillStyle = "#0ff"; ctx.fillText("FingerCloak Canvas Test", 8, 8);
    ctx.fillStyle = "#f0f"; ctx.fillRect(140, 40, 60, 20);
    ctx.strokeStyle = "#0f0"; ctx.beginPath(); ctx.arc(230, 50, 18, 0, 6.283); ctx.stroke();
    const data = c.toDataURL();
    setFp(hash(data));
  }, []);

  return (
    <main style={{ maxWidth: 900, margin: "24px auto", padding: "0 16px" }}>
      <h1>Canvas/WebGL Fingerprint Check</h1>
      <p>Below is the deterministic Canvas hash. FingerCloak stabilization reduces entropy and variability.</p>
      <canvas ref={ref} style={{ border: "1px solid #1b2c50", borderRadius: 8, background: "#0c1322", display: "block", marginTop: 12 }} />
      <p>Hash: <code>{fp}</code></p>
    </main>
  );
}
