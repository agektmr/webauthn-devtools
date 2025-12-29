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
 * Formatting utilities for the DevTools panel.
 */

import { COSE_ALG_NAMES } from '../../../shared/constants';

/**
 * Formats a timestamp as a time string (HH:MM:SS.mmm).
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const seconds = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
}

/**
 * Formats a duration in milliseconds.
 */
export function formatDuration(ms: number | undefined): string {
  if (ms === undefined) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Formats a call type for display.
 */
export function formatCallType(type: string): string {
  switch (type) {
    case 'create':
      return 'credentials.create()';
    case 'get':
      return 'credentials.get()';
    case 'isUserVerifyingPlatformAuthenticatorAvailable':
      return 'isUVPAA()';
    case 'isConditionalMediationAvailable':
      return 'isCMA()';
    case 'getClientCapabilities':
      return 'getClientCapabilities()';
    case 'signalUnknownCredential':
      return 'signalUnknownCredential()';
    case 'signalAllAcceptedCredentials':
      return 'signalAllAcceptedCredentials()';
    case 'signalCurrentUserDetails':
      return 'signalCurrentUserDetails()';
    default:
      return type;
  }
}

/**
 * Gets the algorithm name for a COSE algorithm number.
 */
export function getAlgorithmName(alg: number): string {
  return COSE_ALG_NAMES[alg] || `Unknown (${alg})`;
}

/**
 * Truncates a base64url string for display.
 */
export function truncateBase64(
  base64: string,
  maxLength: number = 32
): string {
  if (base64.length <= maxLength) {
    return base64;
  }
  return base64.substring(0, maxLength) + '...';
}

/**
 * Formats a flag name for display.
 */
export function formatFlagName(flag: string): string {
  const flagNames: Record<string, string> = {
    UP: 'User Present',
    UV: 'User Verified',
    BE: 'Backup Eligible',
    BS: 'Backup State',
    AT: 'Attested Data',
    ED: 'Extensions',
  };
  return flagNames[flag] || flag;
}
