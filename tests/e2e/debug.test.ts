import { test, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('full debug of extension on webauthn.io', async () => {
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

  // Collect ALL console output
  page.on('console', (msg) => {
    console.log(`[PAGE ${msg.type().toUpperCase()}]`, msg.text());
  });
  page.on('pageerror', (error) => {
    console.log(`[PAGE ERROR]`, error.message);
    console.log(`[STACK]`, error.stack);
  });

  console.log('Navigating to webauthn.io...');
  await page.goto('https://webauthn.io');

  console.log('Waiting for page to load...');
  await page.waitForTimeout(2000);

  // Check if our interceptor message appears
  const interceptorInstalled = await page.evaluate(() => {
    // Check if the console logged our message
    return true; // We'll see the console output
  });

  console.log('\n--- Triggering a registration flow ---');

  // Fill in username and try to register
  await page.fill('input[name="username"]', 'testuser' + Date.now());
  await page.waitForTimeout(500);

  // Click register button
  try {
    await page.click('button:has-text("Register")');
    console.log('Clicked Register button');
  } catch (e) {
    console.log('Could not find Register button, trying alternative');
    const buttons = await page.$$('button');
    for (const btn of buttons) {
      const text = await btn.textContent();
      console.log('Found button:', text);
    }
  }

  // Wait for any errors to appear
  await page.waitForTimeout(5000);

  console.log('\n--- Done ---');

  await browser.close();
});
