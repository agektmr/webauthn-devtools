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

/**
 * Script to create a ZIP file of the dist/ folder for Chrome Web Store publishing.
 * The ZIP file is placed at the project root as webauthn-devtools.zip
 */

import { execSync } from 'child_process';
import { existsSync, unlinkSync, readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');
const distDir = resolve(rootDir, 'dist');

// Read version from manifest.json
const manifestPath = resolve(distDir, 'manifest.json');
let zipFileName = 'webauthn-devtools.zip';

if (existsSync(manifestPath)) {
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    if (manifest.version) {
      zipFileName = `webauthn-devtools-v${manifest.version}.zip`;
    }
  } catch {
    // Use default name if manifest can't be parsed
  }
}

const zipPath = resolve(rootDir, zipFileName);

// Remove existing zip if present
if (existsSync(zipPath)) {
  unlinkSync(zipPath);
  console.log(`Removed existing ${zipFileName}`);
}

// Check if dist directory exists
if (!existsSync(distDir)) {
  console.error('Error: dist/ directory does not exist. Run build first.');
  process.exit(1);
}

// Create zip file
try {
  // Use native zip command (works on macOS/Linux)
  execSync(`cd "${distDir}" && zip -r "${zipPath}" .`, { stdio: 'inherit' });
  console.log(`\nCreated ${zipFileName} at project root`);
  console.log('Ready for Chrome Web Store upload!');
} catch (error) {
  console.error('Error creating zip file:', error.message);
  console.error('Make sure the "zip" command is available on your system.');
  process.exit(1);
}
