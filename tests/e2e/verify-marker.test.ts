import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('verify extension marker', async () => {
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

  await page.goto('https://example.com');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    return {
      marker: (window as any).__webauthnDevToolsInstalled,
      createFn: navigator.credentials?.create?.toString().substring(0, 50),
    };
  });

  console.log('Extension marker:', result.marker);
  console.log('create():', result.createFn);

  expect(result.marker).toBe(true);

  await browser.close();
});
