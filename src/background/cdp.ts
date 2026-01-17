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
 * Chrome DevTools Protocol client for virtual authenticator integration.
 */

import type { VirtualAuthenticator } from '../shared/types';

/**
 * Client for interacting with Chrome DevTools Protocol WebAuthn domain.
 */
export class CDPClient {
  private attachedTabs = new Set<number>();

  /**
   * Checks if the debugger API is available (Chrome only).
   */
  private isDebuggerAvailable(): boolean {
    return (
      typeof browser !== 'undefined' &&
      typeof (browser as typeof chrome).debugger !== 'undefined'
    );
  }

  /**
   * Checks if the virtual authenticator environment is enabled for a tab.
   */
  async checkVirtualAuthStatus(tabId: number): Promise<{
    enabled: boolean;
    authenticators: VirtualAuthenticator[];
  }> {
    // Debugger API is only available in Chrome
    if (!this.isDebuggerAvailable()) {
      return { enabled: false, authenticators: [] };
    }

    try {
      // Try to get authenticators - this will fail if WebAuthn domain is not enabled
      const debuggee: chrome.debugger.Debuggee = { tabId };

      // Check if we're already attached
      if (!this.attachedTabs.has(tabId)) {
        try {
          await browser.debugger.attach(debuggee, '1.3');
          this.attachedTabs.add(tabId);
        } catch {
          // Already attached or can't attach
          return { enabled: false, authenticators: [] };
        }
      }

      const result = (await browser.debugger.sendCommand(
        debuggee,
        'WebAuthn.getAuthenticators'
      )) as { authenticators?: VirtualAuthenticator[] };

      return {
        enabled: true,
        authenticators: result.authenticators || [],
      };
    } catch {
      return { enabled: false, authenticators: [] };
    }
  }

  /**
   * Detaches from a tab's debugger.
   */
  async detach(tabId: number): Promise<void> {
    if (this.attachedTabs.has(tabId)) {
      try {
        await browser.debugger.detach({ tabId });
      } catch {
        // Already detached
      }
      this.attachedTabs.delete(tabId);
    }
  }

  /**
   * Sets up event listeners for WebAuthn CDP events.
   */
  setupEventListeners(
    onCredentialAdded?: (tabId: number, authenticatorId: string) => void,
    onCredentialAsserted?: (tabId: number, authenticatorId: string) => void
  ): void {
    browser.debugger.onEvent.addListener((source, method, params) => {
      if (!source.tabId) return;

      switch (method) {
        case 'WebAuthn.credentialAdded':
          onCredentialAdded?.(
            source.tabId,
            (params as { authenticatorId: string }).authenticatorId
          );
          break;
        case 'WebAuthn.credentialAsserted':
          onCredentialAsserted?.(
            source.tabId,
            (params as { authenticatorId: string }).authenticatorId
          );
          break;
      }
    });

    // Clean up when debugger detaches
    browser.debugger.onDetach.addListener((source) => {
      if (source.tabId) {
        this.attachedTabs.delete(source.tabId);
      }
    });
  }
}

/**
 * Singleton instance of the CDP client.
 */
export const cdpClient = new CDPClient();
