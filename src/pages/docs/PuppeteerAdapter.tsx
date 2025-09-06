import React from "react";

export default function PuppeteerAdapter() {
  return (
    <main style={{maxWidth:900,margin:"24px auto",padding:"0 16px"}}>
      <h1>FingerCloak for Puppeteer</h1>
      <pre>{`import puppeteer from 'puppeteer';
import { withFingerCloak } from '@fingercloak/adapter-puppeteer';

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await withFingerCloak(await browser.newPage(), { profile: 'balanced' });
  await page.goto('https://fingercloak.com/lab/');
})();`}</pre>
    </main>
  );
}
