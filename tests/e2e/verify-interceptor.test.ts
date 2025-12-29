import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('verify interceptor is installed and working', async () => {
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
  const page = await context.newPage();

  // Go to a test site
  await page.goto('https://webauthn.io');
  await page.waitForTimeout(2000);

  // Check if interceptor is installed by testing if we can detect our modifications
  const result = await page.evaluate(async () => {
    const results: Record<string, any> = {};

    // Check if navigator.credentials.create is wrapped
    const createFn = navigator.credentials.create.toString();
    results.createModified = !createFn.includes('[native code]');
    results.createFnPreview = createFn.substring(0, 100);

    // Check if navigator.credentials.get is wrapped
    const getFn = navigator.credentials.get.toString();
    results.getModified = !getFn.includes('[native code]');
    results.getFnPreview = getFn.substring(0, 100);

    // Check if window receives messages from our injected script
    let messageReceived = false;
    const originalPostMessage = window.postMessage;

    // Try triggering a WebAuthn call
    try {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), 100);

      await navigator.credentials.create({
        publicKey: {
          challenge: new Uint8Array([1, 2, 3, 4]),
          rp: { name: 'Test', id: 'webauthn.io' },
          user: {
            id: new Uint8Array([1, 2, 3]),
            name: 'test',
            displayName: 'Test',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
        },
        signal: controller.signal,
      });
    } catch (e: any) {
      results.createError = e.name;
    }

    return results;
  });

  console.log('\n=== Interceptor Verification ===');
  console.log('create() modified:', result.createModified);
  console.log('create() preview:', result.createFnPreview);
  console.log('get() modified:', result.getModified);
  console.log('get() preview:', result.getFnPreview);
  console.log('Create error:', result.createError);

  // The functions should be modified (wrapped) by our interceptor
  expect(result.createModified).toBe(true);
  expect(result.getModified).toBe(true);

  await browser.close();
});
