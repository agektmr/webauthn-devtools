import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test.describe('WebAuthn.io specific tests', () => {
  test('test conditional mediation flow like webauthn.io', async () => {
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
    const errors: string[] = [];
    page.on('console', (msg) => {
      const text = msg.text();
      messages.push(`[${msg.type()}] ${text}`);
      if (msg.type() === 'error') {
        errors.push(text);
      }
    });
    page.on('pageerror', (error) => {
      errors.push(error.message);
      messages.push(`[pageerror] ${error.message}`);
    });

    // Go to webauthn.io and wait for conditional UI to start
    await page.goto('https://webauthn.io');

    // Wait for conditional UI setup
    await page.waitForTimeout(3000);

    console.log('\n=== All messages ===');
    messages.forEach((m) => console.log(m));

    console.log('\n=== Errors ===');
    errors.forEach((e) => console.log(e));

    // Check for the specific error
    const hasBufferInError = errors.some((e) =>
      e.includes("Cannot use 'in' operator") && e.includes('buffer')
    );

    if (hasBufferInError) {
      console.log('\n!!! Found the buffer in operator error !!!');
    }

    expect(hasBufferInError).toBe(false);

    await browser.close();
  });

  test('simulate webauthn.io options with string challenge', async () => {
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

    const errors: string[] = [];
    page.on('pageerror', (error) => {
      errors.push(error.message);
    });
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.goto('about:blank');
    await page.waitForTimeout(1000);

    // Simulate what webauthn.io might be doing - passing options that might have
    // already-encoded values somewhere
    const result = await page.evaluate(async () => {
      // Helper to convert base64url to ArrayBuffer
      function base64UrlToBuffer(base64url: string): ArrayBuffer {
        const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
        const paddingNeeded = (4 - (base64.length % 4)) % 4;
        const padded = base64 + '='.repeat(paddingNeeded);
        const binary = atob(padded);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
      }

      try {
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 100);

        // This is what webauthn.io does - converts string to buffer
        const challengeString =
          'C1pbwG2FfkdfWVNw9cxXKsV3mR26ra85wxHTHq7d-lqTsU5sDaS0JYxYSzdoedYdk_NVjl3UM_Hwt0lhZCY_Jw';
        const challenge = base64UrlToBuffer(challengeString);

        await navigator.credentials.get({
          publicKey: {
            challenge: challenge,
            rpId: location.hostname || 'localhost',
            allowCredentials: [],
            userVerification: 'preferred',
            timeout: 60000,
          },
          mediation: 'conditional' as CredentialMediationRequirement,
          signal: controller.signal,
        });
        return 'Success';
      } catch (e: any) {
        return `Error: ${e.name}: ${e.message}`;
      }
    });

    console.log('Result:', result);
    console.log('Errors:', errors);

    await browser.close();
  });
});
