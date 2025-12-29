import { test, expect, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('comprehensive webauthn.io test', async () => {
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

  const allMessages: string[] = [];
  const pageErrors: string[] = [];

  page.on('console', (msg) => {
    allMessages.push(`[${msg.type()}] ${msg.text()}`);
  });

  page.on('pageerror', (error) => {
    pageErrors.push(error.message);
    console.log('PAGE ERROR:', error.message);
  });

  // Go to webauthn.io
  await page.goto('https://webauthn.io');

  // Wait for conditional UI to set up
  await page.waitForTimeout(3000);

  // Check for specific errors
  const hasBufferError = pageErrors.some(
    (e) =>
      e.includes("Cannot use 'in' operator") ||
      e.includes('Cannot read properties of undefined') ||
      e.includes('slice')
  );

  console.log('\n=== Page Errors ===');
  pageErrors.forEach((e) => console.log(e));

  console.log('\n=== Console Messages ===');
  allMessages.slice(0, 20).forEach((m) => console.log(m));

  if (hasBufferError) {
    console.log('\n!!! Buffer-related error found !!!');
  } else {
    console.log('\n✓ No buffer-related errors');
  }

  expect(hasBufferError).toBe(false);

  await browser.close();
});
