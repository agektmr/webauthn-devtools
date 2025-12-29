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
 * Hook for managing WebAuthn call state in the DevTools panel.
 */

import { useState, useEffect, useCallback } from 'react';
import type { WebAuthnCall } from '../../../shared/types';
import type { RuntimeMessage, RuntimePayload } from '../../../shared/messages';

interface UseWebAuthnCallsResult {
  calls: WebAuthnCall[];
  selectedCall: WebAuthnCall | null;
  selectCall: (id: string | null) => void;
  clearCalls: () => void;
}

/**
 * Hook that connects to the background service worker and manages WebAuthn calls.
 */
export function useWebAuthnCalls(): UseWebAuthnCallsResult {
  const [calls, setCalls] = useState<WebAuthnCall[]>([]);
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  useEffect(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;

    // Create a persistent connection to the background
    const port = chrome.runtime.connect({ name: 'webauthn-devtools-panel' });

    // Set up message listener FIRST (before sending PANEL_OPENED)
    // This ensures we're ready to receive the CALLS_UPDATE response
    const handleMessage = (message: RuntimeMessage) => {
      if (message.source !== 'webauthn-devtools') {
        return;
      }

      const payload = message.payload as RuntimePayload;
      if (payload.type === 'CALLS_UPDATE') {
        setCalls(payload.calls);
      }
    };

    port.onMessage.addListener(handleMessage);

    // Now notify background that panel is opened
    // Background will respond with CALLS_UPDATE
    const openMessage: RuntimeMessage = {
      source: 'webauthn-devtools',
      tabId,
      payload: { type: 'PANEL_OPENED', tabId },
    };
    port.postMessage(openMessage);

    // Cleanup
    return () => {
      const closeMessage: RuntimeMessage = {
        source: 'webauthn-devtools',
        tabId,
        payload: { type: 'PANEL_CLOSED', tabId },
      };
      port.postMessage(closeMessage);
      port.disconnect();
    };
  }, []);

  const selectCall = useCallback((id: string | null) => {
    setSelectedCallId(id);
  }, []);

  const clearCalls = useCallback(() => {
    const tabId = chrome.devtools.inspectedWindow.tabId;
    chrome.runtime.sendMessage({
      source: 'webauthn-devtools',
      tabId,
      payload: { type: 'CLEAR_CALLS', tabId },
    });
    setCalls([]);
    setSelectedCallId(null);
  }, []);

  const selectedCall = selectedCallId
    ? calls.find((c) => c.id === selectedCallId) || null
    : null;

  return { calls, selectedCall, selectCall, clearCalls };
}
