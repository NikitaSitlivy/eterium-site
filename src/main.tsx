import React from "react";
import { createRoot } from "react-dom/client";
import { HashRouter, Routes, Route, Navigate } from "react-router-dom";

import App from "./App"; // Лаборатория
import WebRTCLeak from "./pages/checks/WebRTCLeak";
import CanvasFingerprint from "./pages/checks/CanvasFingerprint";
import PlaywrightAdapter from "./pages/docs/PlaywrightAdapter";
import PuppeteerAdapter from "./pages/docs/PuppeteerAdapter";
import Faq from "./pages/Faq";
import "./styles.css";

/**
 * HashRouter даёт URL вида https://fingercloak.com/#/lab
 * Все переходы внутри — без перезагрузки.
 * На корне "/" оставляем пустышку, чтобы не перекрывать статический лендинг из index.html.
 */
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        {/* пустая страница для "/" (сам лендинг — в index.html) */}
        <Route path="/" element={<div />} />
        {/* Лаба и внутренние страницы */}
        <Route path="/lab/*" element={<App />} />
        <Route path="/check/webrtc-ip-leak" element={<WebRTCLeak />} />
        <Route path="/check/canvas-fingerprint" element={<CanvasFingerprint />} />
        <Route path="/docs/playwright-adapter" element={<PlaywrightAdapter />} />
        <Route path="/docs/puppeteer-adapter" element={<PuppeteerAdapter />} />
        <Route path="/faq" element={<Faq />} />
        {/* страховка: неизвестные маршруты — в /lab */}
        <Route path="*" element={<Navigate to="/lab" replace />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);
