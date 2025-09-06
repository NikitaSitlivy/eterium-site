import React from "react";

export default function Faq() {
  return (
    <main style={{maxWidth:900,margin:"24px auto",padding:"0 16px"}}>
      <h1>FAQ: FingerCloak</h1>
      <h2>What is a browser fingerprint?</h2>
      <p>A combination of browser/device parameters (Canvas/WebGL, fonts, codecs, etc.) that allow you to be identified.</p>
      <h2>How does FingerCloak help?</h2>
      <p>Stabilizes/masks parameters, prevents WebRTC IP leaks, provides an SDK and a browser extension.</p>
    </main>
  );
}
