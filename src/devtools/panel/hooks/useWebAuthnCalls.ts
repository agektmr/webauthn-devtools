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

import { useState, useEffect, useCallback, useRef } from 'react';
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
  const pollingIntervalRef = useRef<number | null>(null);
  const isSafariRef = useRef(false);

  useEffect(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;

    // Detect Safari by tabId === -1
    isSafariRef.current = tabId === -1;

    // Create a persistent connection to the background
    const port = browser.runtime.connect({ name: 'webauthn-devtools-panel' });

    // Set up message listener
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

    // Safari polling fallback - Safari's ports disconnect immediately
    // so we poll for updates using runtime.sendMessage instead
    const startPolling = () => {
      if (pollingIntervalRef.current) return;

      pollingIntervalRef.current = window.setInterval(() => {
        browser.runtime.sendMessage({
          source: 'webauthn-devtools',
          tabId,
          payload: { type: 'GET_CALLS', tabId },
        } as RuntimeMessage).then((response: { calls?: WebAuthnCall[] } | undefined) => {
          if (response?.calls) {
            setCalls(response.calls);
          }
        }).catch(() => {
          // Ignore errors during polling
        });
      }, 500); // Poll every 500ms
    };

    // Handle port disconnect - start polling if Safari
    port.onDisconnect.addListener(() => {
      if (isSafariRef.current) {
        startPolling();
      }
    });

    // Send PANEL_OPENED
    const openMessage: RuntimeMessage = {
      source: 'webauthn-devtools',
      tabId,
      payload: { type: 'PANEL_OPENED', tabId },
    };

    try {
      port.postMessage(openMessage);
    } catch {
      if (isSafariRef.current) {
        startPolling();
      }
    }

    // Cleanup
    return () => {
      if (pollingIntervalRef.current) {
        window.clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      try {
        port.disconnect();
      } catch {
        // Port may already be disconnected
      }
    };
  }, []);

  const selectCall = useCallback((id: string | null) => {
    setSelectedCallId(id);
  }, []);

  const clearCalls = useCallback(() => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    browser.runtime.sendMessage({
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
