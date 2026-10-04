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
 * Script to package dist/chrome into a signed CRX3 (.crx) archive for Chrome Web Store upload.
 * Usage: node scripts/build-crx.js [chrome]
 *
 * Uses CRX_KEY_FILE (default: ./webauthn-devtools.pem). If the private key file does not exist,
 * a new 2048-bit RSA private key is generated and saved with 0600 permissions (ignored by Git).
 */

import { execFileSync } from 'child_process';
import {
  createHash,
  createPrivateKey,
  createPublicKey,
  createSign,
  generateKeyPairSync,
} from 'crypto';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, '..');

const browser = process.argv[2] || 'chrome';
if (browser !== 'chrome') {
  console.error('Error: CRX packaging is only supported for "chrome".');
  process.exit(1);
}

const distDir = resolve(rootDir, 'dist', 'chrome');
const manifestPath = resolve(distDir, 'manifest.json');

if (!existsSync(manifestPath)) {
  console.error(
    'Error: dist/chrome/manifest.json does not exist. Run "npm run build:chrome" first.'
  );
  process.exit(1);
}

const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
if (manifest.key) {
  console.error(
    'Error: dist/chrome/manifest.json contains a "key" field (local developer key). ' +
      'Rebuild with "npm run build:chrome" without INJECT_KEY/EXTENSION_KEY before creating a store CRX.'
  );
  process.exit(1);
}

// Ensure a fresh, clean ZIP archive without .map files is built first
execFileSync(process.execPath, [resolve(__dirname, 'build-zip.js'), 'chrome'], {
  stdio: 'inherit',
});

const versionSuffix = manifest.version ? `-v${manifest.version}` : '';
const zipFileName = `webauthn-devtools-chrome${versionSuffix}.zip`;
const crxFileName = `webauthn-devtools-chrome${versionSuffix}.crx`;
const zipPath = resolve(rootDir, zipFileName);
const crxPath = resolve(rootDir, crxFileName);
const keyPath =
  process.env.CRX_KEY_FILE || resolve(rootDir, 'webauthn-devtools.pem');

function encodeVarint(value) {
  const bytes = [];
  let v = value >>> 0;
  while (v >= 0x80) {
    bytes.push((v & 0x7f) | 0x80);
    v >>>= 7;
  }
  bytes.push(v);
  return Buffer.from(bytes);
}

function encodeLengthDelimitedField(fieldNumber, payloadBuffer) {
  const tag = (fieldNumber << 3) | 2;
  return Buffer.concat([
    encodeVarint(tag),
    encodeVarint(payloadBuffer.length),
    payloadBuffer,
  ]);
}

function computeExtensionId(crxIdBytes) {
  return Array.from(crxIdBytes.toString('hex'))
    .map((hexChar) => String.fromCharCode(97 + parseInt(hexChar, 16)))
    .join('');
}

let privateKeyPem;
if (existsSync(keyPath)) {
  privateKeyPem = readFileSync(keyPath, 'utf-8');
  console.log(`Using existing private key: ${keyPath}`);
} else {
  const { privateKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    publicKeyEncoding: { type: 'spki', format: 'pem' },
  });
  privateKeyPem = privateKey;
  writeFileSync(keyPath, privateKeyPem, { mode: 0o600 });
  console.log(`Generated new 2048-bit RSA private key at ${keyPath}`);
  console.log(
    'IMPORTANT: Keep this .pem file safe and backed up outside Git! You will need it to upload future updates to the Chrome Web Store.'
  );
}

const privateKeyObj = createPrivateKey(privateKeyPem);
const publicKeyDer = createPublicKey(privateKeyObj).export({
  type: 'spki',
  format: 'der',
});

// CRX ID is the first 16 bytes of SHA-256(publicKeyDer)
const crxId = createHash('sha256').update(publicKeyDer).digest().subarray(0, 16);
const extensionId = computeExtensionId(crxId);

// SignedData protobuf: message SignedData { optional bytes crx_id = 1; }
const signedHeaderData = encodeLengthDelimitedField(1, crxId);

const zipBuffer = readFileSync(zipPath);

// Sign "CRX3 SignedData\0" + uint32le(signedHeaderData.length) + signedHeaderData + zipBuffer
const signedHeaderSizeBuf = Buffer.alloc(4);
signedHeaderSizeBuf.writeUInt32LE(signedHeaderData.length, 0);

const signer = createSign('RSA-SHA256');
signer.update(Buffer.from('CRX3 SignedData\0', 'utf-8'));
signer.update(signedHeaderSizeBuf);
signer.update(signedHeaderData);
signer.update(zipBuffer);
const signature = signer.sign(privateKeyObj);

// AsymmetricKeyProof protobuf: { optional bytes public_key = 1; optional bytes signature = 2; }
const asymmetricKeyProof = Buffer.concat([
  encodeLengthDelimitedField(1, publicKeyDer),
  encodeLengthDelimitedField(2, signature),
]);

// CrxFileHeader protobuf: { repeated AsymmetricKeyProof sha256_with_rsa = 2; optional bytes signed_header_data = 10000; }
const crxFileHeader = Buffer.concat([
  encodeLengthDelimitedField(2, asymmetricKeyProof),
  encodeLengthDelimitedField(10000, signedHeaderData),
]);

const magic = Buffer.from('Cr24', 'utf-8');
const versionBuf = Buffer.alloc(4);
versionBuf.writeUInt32LE(3, 0);
const headerSizeBuf = Buffer.alloc(4);
headerSizeBuf.writeUInt32LE(crxFileHeader.length, 0);

const crxBuffer = Buffer.concat([
  magic,
  versionBuf,
  headerSizeBuf,
  crxFileHeader,
  zipBuffer,
]);

writeFileSync(crxPath, crxBuffer);

console.log(`\nCreated ${crxFileName} at project root`);
console.log(`Extension ID: ${extensionId}`);
console.log('Ready for Chrome Web Store upload!');
