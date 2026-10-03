/**
 * Copyright 2025 Eiji Kitamura
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from 'fs';

// Load local environment variables (including .env.local)
const localEnv = loadEnv('development', process.cwd(), '');

// Get target browser from environment variable (default: chrome)
const targetBrowser = process.env.TARGET_BROWSER || 'chrome';
const outDir = `dist/${targetBrowser}`;

// Get minify option from environment variable (default: true)
// Set MINIFY=false to disable minification (useful for store submissions requiring readable code)
const shouldMinify = process.env.MINIFY !== 'false';

// Enable sourcemaps only when explicitly requested for local development
// Store packages should not include .map files
const shouldSourcemap =
  process.env.SOURCEMAP === 'true' || process.env.INJECT_KEY === 'true';

function resolveDeveloperPublicKey(): { key: string; source: string } | null {
  const allowLocalEnv = process.env.INJECT_KEY === 'true';
  const inlineKey =
    process.env.EXTENSION_KEY || (allowLocalEnv ? localEnv.EXTENSION_KEY : '');
  if (inlineKey) {
    return {
      key: inlineKey.trim(),
      source: 'EXTENSION_KEY',
    };
  }

  const keyFile =
    process.env.EXTENSION_KEY_FILE ||
    (allowLocalEnv ? localEnv.EXTENSION_KEY_FILE : '');
  if (!keyFile) {
    return null;
  }

  if (!existsSync(keyFile)) {
    throw new Error(
      `Developer public key file not found at "${keyFile}". Check EXTENSION_KEY_FILE.`
    );
  }

  return {
    key: readFileSync(keyFile, 'utf-8').trim(),
    source: keyFile,
  };
}

// Plugin to copy static assets and fix HTML paths after build
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    closeBundle() {
      // Copy manifest.json (use browser-specific manifest)
      const manifestSource =
        targetBrowser === 'firefox'
          ? 'src/manifests/manifest.firefox.json'
          : targetBrowser === 'safari'
            ? 'src/manifests/manifest.safari.json'
            : 'src/manifests/manifest.chrome.json';
      const manifestSourcePath = resolve(__dirname, manifestSource);
      const manifestDestPath = resolve(__dirname, outDir, 'manifest.json');

      const devKey =
        targetBrowser === 'chrome' ? resolveDeveloperPublicKey() : null;
      if (devKey) {
        const manifest = JSON.parse(readFileSync(manifestSourcePath, 'utf-8'));
        manifest.key = devKey.key;
        writeFileSync(
          manifestDestPath,
          `${JSON.stringify(manifest, null, 2)}\n`
        );
        console.log(
          `Injected developer public key from ${devKey.source} into ${outDir}/manifest.json (local unpacked development only)`
        );
      } else {
        copyFileSync(manifestSourcePath, manifestDestPath);
      }

      // Copy icons
      const iconsDir = resolve(__dirname, 'public/icons');
      const distIconsDir = resolve(__dirname, outDir, 'icons');
      mkdirSync(distIconsDir, { recursive: true });

      for (const file of readdirSync(iconsDir)) {
        copyFileSync(
          resolve(iconsDir, file),
          resolve(distIconsDir, file)
        );
      }

      // Move and fix devtools.html
      let devtoolsHtml = readFileSync(
        resolve(__dirname, outDir, 'src/devtools/index.html'),
        'utf-8'
      );
      // Fix paths from ../../ to ./
      devtoolsHtml = devtoolsHtml.replace(/\.\.\/\.\.\//g, './');
      writeFileSync(resolve(__dirname, outDir, 'devtools.html'), devtoolsHtml);

      // Move and fix panel.html
      let panelHtml = readFileSync(
        resolve(__dirname, outDir, 'src/devtools/panel/index.html'),
        'utf-8'
      );
      // Fix paths from ../../../ to ./
      panelHtml = panelHtml.replace(/\.\.\/\.\.\/\.\.\//g, './');
      writeFileSync(resolve(__dirname, outDir, 'panel.html'), panelHtml);

      // Remove the src directory
      rmSync(resolve(__dirname, outDir, 'src'), { recursive: true });

      console.log(`Copied and fixed static assets in ${outDir}/`);
    },
  };
}

export default defineConfig({
  plugins: [react(), copyStaticAssets()],
  base: './',
  resolve: {
    alias: {
      '@shared': resolve(__dirname, 'src/shared'),
      '@parsers': resolve(__dirname, 'src/parsers'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
        // injected is built separately with vite.config.injected.ts as IIFE
        devtools: resolve(__dirname, 'src/devtools/index.html'),
        panel: resolve(__dirname, 'src/devtools/panel/index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    outDir,
    emptyOutDir: true,
    sourcemap: shouldSourcemap,
    minify: shouldMinify,
  },
});
