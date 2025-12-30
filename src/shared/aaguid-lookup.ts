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
 * AAGUID lookup utility for identifying authenticators/password managers.
 */

import aaguidData from './aaguid.json';

export interface AAGUIDMetadata {
  name: string;
}

const aaguidMap = aaguidData as Record<string, AAGUIDMetadata>;

/**
 * Looks up the metadata for a given AAGUID.
 * @param aaguid - The AAGUID in UUID format (e.g., "ea9b8d66-4d01-1d21-3ce4-b6b48cb575d4")
 * @returns The metadata if found, or undefined
 */
export function lookupAAGUID(aaguid: string): AAGUIDMetadata | undefined {
  // Normalize the AAGUID to lowercase for consistent lookup
  const normalizedAaguid = aaguid.toLowerCase();
  return aaguidMap[normalizedAaguid];
}

/**
 * Gets the authenticator/password manager name for a given AAGUID.
 * @param aaguid - The AAGUID in UUID format
 * @returns The name if found, or undefined
 */
export function getAuthenticatorName(aaguid: string): string | undefined {
  const metadata = lookupAAGUID(aaguid);
  return metadata?.name;
}

/**
 * Checks if the AAGUID represents the "all zeros" placeholder (no AAGUID).
 * This typically indicates a virtual authenticator or unidentified authenticator.
 */
export function isZeroAAGUID(aaguid: string): boolean {
  return aaguid === '00000000-0000-0000-0000-000000000000';
}
