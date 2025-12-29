import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test.describe('WebAuthn DevTools Extension', () => {
  test('captures WebAuthn create() call without errors', async () => {
    // Launch browser with extension
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

    // Collect console errors
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    // Navigate to a test page
    await page.goto('https://webauthn.io');

    // Wait for extension to inject
    await page.waitForTimeout(1000);

    // Check if interceptor was installed
    const interceptorInstalled = await page.evaluate(() => {
      return (window as any).__webauthnDevToolsInstalled !== undefined ||
        document.documentElement.innerHTML.includes('WebAuthn DevTools');
    });

    console.log('Checking for console messages...');

    // Try to trigger a WebAuthn call and capture the error
    const result = await page.evaluate(async () => {
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args) => {
        logs.push(args.map(a => String(a)).join(' '));
        originalLog.apply(console, args);
      };

      try {
        // Create a simple WebAuthn request
        const options: PublicKeyCredentialCreationOptions = {
          challenge: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]),
          rp: { name: 'Test', id: 'webauthn.io' },
          user: {
            id: new Uint8Array([1, 2, 3, 4]),
            name: 'test@example.com',
            displayName: 'Test User',
          },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
          timeout: 5000,
        };

        // Use AbortController to cancel quickly
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100);

        await navigator.credentials.create({
          publicKey: options,
          signal: controller.signal,
        });
      } catch (e) {
        // Expected to be aborted or fail - we just want to test the interceptor
        logs.push(`Caught: ${e}`);
      }

      return { logs };
    });

    console.log('Logs from page:', result.logs);
    console.log('Errors:', errors);

    // Check for specific error about 'in' operator
    const hasInOperatorError = errors.some(e =>
      e.includes("Cannot use 'in' operator") ||
      e.includes('Cannot read properties of undefined')
    );

    if (hasInOperatorError) {
      console.log('Found the error! Errors:', errors);
    }

    expect(hasInOperatorError).toBe(false);

    await browser.close();
  });

  test('debug: check what values are passed to serializer', async () => {
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

    // Collect all console messages
    const messages: string[] = [];
    page.on('console', (msg) => {
      messages.push(`[${msg.type()}] ${msg.text()}`);
    });
    page.on('pageerror', (error) => {
      messages.push(`[pageerror] ${error.message}`);
    });

    await page.goto('https://webauthn.io');
    await page.waitForTimeout(2000);

    // Try WebAuthn get() with allowCredentials
    const result = await page.evaluate(async () => {
      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100);

        await navigator.credentials.get({
          publicKey: {
            challenge: new Uint8Array([1, 2, 3, 4]),
            rpId: 'webauthn.io',
            allowCredentials: [
              {
                type: 'public-key',
                id: new Uint8Array([5, 6, 7, 8]),
              },
            ],
            timeout: 5000,
          },
          signal: controller.signal,
        });
      } catch (e) {
        return `Error: ${e}`;
      }
      return 'Success';
    });

    console.log('Result:', result);
    console.log('All messages:', messages);

    await browser.close();
  });
});
