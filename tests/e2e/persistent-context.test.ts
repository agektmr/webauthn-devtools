import { test, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { mkdtempSync } from 'fs';
import { tmpdir } from 'os';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('test with persistent context', async () => {
  const pathToExtension = resolve(__dirname, '../../dist');
  const userDataDir = mkdtempSync(`${tmpdir()}/pw-ext-test-`);

  console.log('Extension path:', pathToExtension);
  console.log('User data dir:', userDataDir);

  // Use launchPersistentContext for extensions
  const context = await chromium.launchPersistentContext(userDataDir, {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });

  // Listen for service workers
  context.on('serviceworker', (sw) => {
    console.log('Service worker started:', sw.url());
  });

  // Wait for extension to load
  await new Promise((r) => setTimeout(r, 2000));

  const swCount = context.serviceWorkers().length;
  console.log('Service workers:', swCount);
  context.serviceWorkers().forEach((sw) => console.log('  -', sw.url()));

  // Get or create a page
  const pages = context.pages();
  const page = pages.length > 0 ? pages[0] : await context.newPage();

  await page.goto('https://example.com');
  await page.waitForTimeout(2000);

  const result = await page.evaluate(() => {
    return {
      marker: (window as any).__webauthnDevToolsInstalled,
      createFn: navigator.credentials?.create?.toString().substring(0, 100),
    };
  });

  console.log('\nExtension check:');
  console.log('Marker:', result.marker);
  console.log('create():', result.createFn);

  await context.close();
});
