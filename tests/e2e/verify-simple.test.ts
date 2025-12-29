import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('verify interceptor on simple site', async () => {
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

  // Go to a simple site (example.com doesn't have strict CSP)
  await page.goto('https://example.com');
  await page.waitForTimeout(2000);

  // Check if interceptor is installed
  const result = await page.evaluate(() => {
    const createFn = navigator.credentials?.create?.toString() || 'undefined';
    const getFn = navigator.credentials?.get?.toString() || 'undefined';

    return {
      hasCredentials: typeof navigator.credentials !== 'undefined',
      createModified: !createFn.includes('[native code]'),
      createFn: createFn.substring(0, 200),
      getModified: !getFn.includes('[native code]'),
      getFn: getFn.substring(0, 200),
    };
  });

  console.log('\n=== example.com Test ===');
  console.log('Has credentials API:', result.hasCredentials);
  console.log('create() modified:', result.createModified);
  console.log('create():', result.createFn);
  console.log('get() modified:', result.getModified);
  console.log('get():', result.getFn);

  // Now test on a different site
  await page.goto('https://google.com');
  await page.waitForTimeout(2000);

  const result2 = await page.evaluate(() => {
    const createFn = navigator.credentials?.create?.toString() || 'undefined';
    const getFn = navigator.credentials?.get?.toString() || 'undefined';

    return {
      createModified: !createFn.includes('[native code]'),
      createFn: createFn.substring(0, 200),
      getModified: !getFn.includes('[native code]'),
      getFn: getFn.substring(0, 200),
    };
  });

  console.log('\n=== google.com Test ===');
  console.log('create() modified:', result2.createModified);
  console.log('create():', result2.createFn);
  console.log('get() modified:', result2.getModified);
  console.log('get():', result2.getFn);

  await browser.close();
});
