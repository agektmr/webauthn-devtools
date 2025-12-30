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
 * Export utilities for WebAuthn call data.
 */

import type {
  WebAuthnCall,
  ExportData,
  CreateResponse,
  GetResponse,
} from '../../../shared/types';
import {
  parseClientData,
  parseAttestationObject,
  parseAuthData,
} from '../../../parsers';
import { base64UrlToArrayBuffer } from '../../../injected/serializer';

/**
 * Enriches a WebAuthn call with parsed data for export.
 */
function enrichCallWithParsedData(call: WebAuthnCall): WebAuthnCall {
  if (call.status !== 'success' || !call.response) {
    return call;
  }

  if (call.type === 'create') {
    const response = call.response as CreateResponse;
    try {
      const clientData = response.response.clientDataJSON
        ? parseClientData(response.response.clientDataJSON)
        : undefined;

      const attestation = response.response.attestationObject
        ? parseAttestationObject(
            base64UrlToArrayBuffer(response.response.attestationObject)
          )
        : undefined;

      if (clientData || attestation) {
        return {
          ...call,
          response: {
            ...response,
            parsed: {
              clientData: clientData!,
              attestation: attestation!,
            },
          },
        };
      }
    } catch (error) {
      console.error('Failed to parse create response for export:', error);
    }
  }

  if (call.type === 'get') {
    const response = call.response as GetResponse;
    try {
      const clientData = response.response.clientDataJSON
        ? parseClientData(response.response.clientDataJSON)
        : undefined;

      const authData = response.response.authenticatorData
        ? parseAuthData(
            base64UrlToArrayBuffer(response.response.authenticatorData)
          )
        : undefined;

      if (clientData || authData) {
        return {
          ...call,
          response: {
            ...response,
            parsed: {
              clientData: clientData!,
              authData: authData!,
            },
          },
        };
      }
    } catch (error) {
      console.error('Failed to parse get response for export:', error);
    }
  }

  return call;
}

/**
 * Creates an export data object from the current calls.
 * Includes parsed clientDataJSON, authenticatorData, and attestedCredentialData.
 */
export function createExportData(calls: WebAuthnCall[]): ExportData {
  const enrichedCalls = calls.map(enrichCallWithParsedData);

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    origin: window.location.origin,
    userAgent: navigator.userAgent,
    calls: enrichedCalls,
  };
}

/**
 * Downloads the export data as a JSON file.
 */
export function downloadExport(calls: WebAuthnCall[]): void {
  const data = createExportData(calls);
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `webauthn-calls-${timestamp}.json`;

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
}
