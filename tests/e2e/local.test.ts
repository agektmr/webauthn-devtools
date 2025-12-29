import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('test extension with local file', async () => {
  const pathToExtension = resolve(__dirname, '../../dist');
  const testPagePath = resolve(__dirname, 'test-page.html');

  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--disable-web-security', // Allow file:// URLs
    ],
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  // Collect console messages
  const logs: string[] = [];
  const errors: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    logs.push(`[${msg.type()}] ${text}`);
    console.log(`[${msg.type().toUpperCase()}]`, text);
  });

  page.on('pageerror', (error) => {
    errors.push(error.message);
    console.log('[PAGEERROR]', error.message);
  });

  // Navigate to local test page
  await page.goto(`file://${testPagePath}`);
  await page.waitForTimeout(1000);

  // Check for interceptor installed message
  const interceptorInstalled = logs.some((log) =>
    log.includes('WebAuthn DevTools: Interceptors installed')
  );
  console.log('\nInterceptor installed:', interceptorInstalled);

  // Click create button
  console.log('\n--- Testing Create ---');
  await page.click('#create');
  await page.waitForTimeout(500);

  // Click get button
  console.log('\n--- Testing Get ---');
  await page.click('#get');
  await page.waitForTimeout(500);

  console.log('\n=== All logs ===');
  logs.forEach((l) => console.log(l));

  console.log('\n=== Errors ===');
  errors.forEach((e) => console.log(e));

  // Check for any serialization errors
  const hasSerializerError = errors.some(
    (e) =>
      e.includes("Cannot use 'in' operator") ||
      e.includes('Cannot read properties of undefined')
  );

  expect(hasSerializerError).toBe(false);

  await browser.close();
});
