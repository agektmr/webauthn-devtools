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
 * Parser for WebAuthn clientDataJSON.
 */

import type { ParsedClientData } from '../shared/types';
import { base64UrlToArrayBuffer } from '../injected/serializer';

/**
 * Parses clientDataJSON from a WebAuthn response.
 * The input is a base64url-encoded JSON string.
 */
export function parseClientData(base64url: string): ParsedClientData {
  const buffer = base64UrlToArrayBuffer(base64url);
  const bytes = new Uint8Array(buffer);
  const jsonString = new TextDecoder().decode(bytes);
  return JSON.parse(jsonString) as ParsedClientData;
}
