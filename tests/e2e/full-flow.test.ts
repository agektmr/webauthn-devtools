import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync, rmSync } from 'fs';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('full message flow test', async () => {
  test.setTimeout(60000);

  const pathToExtension = resolve(__dirname, '../../dist');
  const userDataDir = mkdtempSync(`${tmpdir()}/pw-ext-test-`);

  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Get the service worker for logging
  let backgroundWorker = context.serviceWorkers()[0];
  if (!backgroundWorker) {
    backgroundWorker = await context.waitForEvent('serviceworker');
  }

  const bgLogs: string[] = [];
  backgroundWorker.on('console', (msg) => {
    bgLogs.push(msg.text());
  });

  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  const pageLogs: string[] = [];
  page.on('console', (msg) => {
    pageLogs.push(msg.text());
  });

  // Navigate to webauthn.io
  await page.goto('https://webauthn.io');
  await page.waitForTimeout(2000);

  // Verify interceptor is installed
  const interceptorInstalled = await page.evaluate(() => {
    return (window as any).__webauthnDevToolsInstalled === true;
  });
  console.log('Interceptor installed:', interceptorInstalled);
  expect(interceptorInstalled).toBe(true);

  // Trigger a WebAuthn create call
  console.log('\nTriggering WebAuthn create()...');
  await page.evaluate(async () => {
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 200);

      await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          rp: { name: 'Test', id: 'webauthn.io' },
          user: {
            id: new Uint8Array([1, 2, 3, 4]),
            name: 'test@test.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 1000,
        },
        signal: controller.signal,
      });
    } catch (e) {
      // Expected to abort
    }
  });

  await page.waitForTimeout(500);

  console.log('\n=== Background Logs ===');
  bgLogs.filter((l) => l.includes('WebAuthn')).forEach((l) => console.log(l));

  console.log('\n=== Page Logs ===');
  pageLogs.filter((l) => l.includes('WebAuthn')).forEach((l) => console.log(l));

  // Check if messages flowed through
  const bgReceivedStart = bgLogs.some((l) =>
    l.includes('WEBAUTHN_CALL_START')
  );
  const bgReceivedAbort = bgLogs.some((l) =>
    l.includes('WEBAUTHN_CALL_ABORT')
  );

  console.log('\n=== Results ===');
  console.log('Background received CALL_START:', bgReceivedStart);
  console.log('Background received CALL_ABORT:', bgReceivedAbort);

  expect(bgReceivedStart).toBe(true);

  await context.close();
  rmSync(userDataDir, { recursive: true, force: true });
});
