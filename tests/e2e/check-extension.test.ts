import { test, chromium } from '@playwright/test';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

test('check if extension is loaded', async () => {
  const pathToExtension = resolve(__dirname, '../../dist');
  console.log('Extension path:', pathToExtension);

  const browser = await chromium.launch({
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
      '--enable-logging=stderr',
      '--v=1',
    ],
  });

  const context = await browser.newContext();

  // Check for service workers (extension background scripts)
  const serviceWorkers = context.serviceWorkers();
  console.log('Service workers at start:', serviceWorkers.length);

  // Listen for new service workers
  context.on('serviceworker', (sw) => {
    console.log('New service worker:', sw.url());
  });

  const page = await context.newPage();

  // Wait a bit for extension to load
  await page.waitForTimeout(2000);

  // Check service workers again
  const swsAfter = context.serviceWorkers();
  console.log('Service workers after wait:', swsAfter.length);
  swsAfter.forEach((sw) => console.log('  -', sw.url()));

  // Try to navigate to example.com
  await page.goto('https://example.com');
  await page.waitForTimeout(1000);

  // Check if any extension-related elements exist
  const result = await page.evaluate(() => {
    // Check for our marker
    const marker = (window as any).__webauthnDevToolsInstalled;

    // Check for any extension-injected scripts
    const scripts = Array.from(document.querySelectorAll('script'));
    const extScripts = scripts.filter((s) =>
      s.src?.includes('chrome-extension')
    );

    return {
      marker,
      extScriptCount: extScripts.length,
      extScripts: extScripts.map((s) => s.src),
    };
  });

  console.log('\nExtension check:');
  console.log('Marker:', result.marker);
  console.log('Extension scripts found:', result.extScriptCount);
  console.log('Scripts:', result.extScripts);

  await browser.close();
});
