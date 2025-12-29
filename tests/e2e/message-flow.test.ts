import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('trace message flow through extension', async () => {
  test.setTimeout(60000);
  const pathToExtension = resolve(__dirname, '../../dist');

  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  const context = await browser.newContext();

  // Collect background logs - service worker might not be available immediately
  const backgroundLogs: string[] = [];

  const setupServiceWorkerLogging = (sw: any) => {
    sw.on('console', (msg: any) => {
      const text = msg.text();
      backgroundLogs.push(text);
      if (text.includes('WebAuthn DevTools')) {
        console.log('[BACKGROUND]', text);
      }
    });
  };

  // Listen for service worker
  context.on('serviceworker', setupServiceWorkerLogging);

  // Check if already running
  const existingSW = context.serviceWorkers()[0];
  if (existingSW) {
    setupServiceWorkerLogging(existingSW);
  }

  const page = await context.newPage();

  // Collect ALL page logs
  const pageLogs: string[] = [];
  page.on('console', (msg) => {
    const text = msg.text();
    pageLogs.push(`[${msg.type()}] ${text}`);
    if (text.includes('WebAuthn DevTools')) {
      console.log('[PAGE]', text);
    }
  });

  console.log('\n=== Navigating to webauthn.io ===');
  await page.goto('https://webauthn.io');
  await page.waitForTimeout(2000);

  console.log('\n=== Triggering WebAuthn get() via conditional UI ===');
  // The conditional UI should have already triggered a get() call
  await page.waitForTimeout(1000);

  console.log('\n=== Manually triggering WebAuthn create() ===');
  // Trigger a create call
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
            displayName: 'Test',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 1000,
        },
        signal: controller.signal,
      });
    } catch (e) {
      // Expected
    }
  });

  await page.waitForTimeout(1000);

  console.log('\n=== All Background logs ===');
  backgroundLogs.forEach(l => console.log(l));

  console.log('\n=== All Page logs ===');
  pageLogs.forEach(l => console.log(l));

  // Check if messages were received
  const receivedFromContent = backgroundLogs.some(l =>
    l.includes('Received:') && l.includes('WEBAUTHN_CALL')
  );

  const injectedPosted = pageLogs.some(l => l.includes('Posting message'));
  const contentReceived = pageLogs.some(l => l.includes('Received from injected'));

  console.log('\n=== Results ===');
  console.log('Injected script posted messages:', injectedPosted);
  console.log('Content script received messages:', contentReceived);
  console.log('Background received messages from content:', receivedFromContent);

  // Don't fail the test - just report findings
  console.log('Test complete');

  await browser.close();
});
