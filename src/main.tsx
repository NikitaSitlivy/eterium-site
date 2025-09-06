import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App"; // лаборатория
import WebRTCLeak from "./pages/checks/WebRTCLeak";
import CanvasFingerprint from "./pages/checks/CanvasFingerprint";
import PlaywrightAdapter from "./pages/docs/PlaywrightAdapter";
import PuppeteerAdapter from "./pages/docs/PuppeteerAdapter";
import Faq from "./pages/Faq";
import "./styles.css";

/**
 * "/" — пустышка, чтобы не затирать статический лендинг из index.html.
 * "/lab" — лаборатория (App) и другие маршруты.
 */
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<div />} />
        <Route path="/lab" element={<App />} />
        <Route path="/check/webrtc-ip-leak" element={<WebRTCLeak />} />
        <Route path="/check/canvas-fingerprint" element={<CanvasFingerprint />} />
        <Route path="/docs/playwright-adapter" element={<PlaywrightAdapter />} />
        <Route path="/docs/puppeteer-adapter" element={<PuppeteerAdapter />} />
        <Route path="/faq" element={<Faq />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
