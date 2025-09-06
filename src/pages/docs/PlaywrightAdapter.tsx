import React from "react";

export default function PlaywrightAdapter() {
  return (
    <main style={{maxWidth:900,margin:"24px auto",padding:"0 16px"}}>
      <h1>FingerCloak for Playwright</h1>
      <p>SDK injection before page scripts, profiles, and fingerprint stabilization.</p>
      <pre>{`// tests/example.spec.ts
import { test } from '@playwright/test';
import { withFingerCloak } from '@fingercloak/adapter-playwright';

test('fingercloak before page scripts', async ({ browser }) => {
  const context = await withFingerCloak(browser, { profile: 'balanced' });
  const page = await context.newPage();
  await page.goto('https://fingercloak.com/lab/');
});`}</pre>
    </main>
  );
}
