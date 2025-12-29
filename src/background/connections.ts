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
 * Manages DevTools panel connections.
 */

import type { RuntimePayload } from '../shared/messages';

/**
 * Manages connections from DevTools panels to the background service worker.
 */
export class ConnectionManager {
  private connections = new Map<number, chrome.runtime.Port>();

  /**
   * Registers a new panel connection for a tab.
   */
  addConnection(tabId: number, port: chrome.runtime.Port): void {
    // Close existing connection if any
    const existing = this.connections.get(tabId);
    if (existing) {
      existing.disconnect();
    }

    this.connections.set(tabId, port);

    // Remove connection when port disconnects
    port.onDisconnect.addListener(() => {
      this.connections.delete(tabId);
    });
  }

  /**
   * Removes a panel connection.
   */
  removeConnection(tabId: number): void {
    const port = this.connections.get(tabId);
    if (port) {
      port.disconnect();
      this.connections.delete(tabId);
    }
  }

  /**
   * Sends a message to the panel for a specific tab.
   */
  sendToPanel(tabId: number, payload: RuntimePayload): void {
    const port = this.connections.get(tabId);
    if (port) {
      try {
        port.postMessage({ source: 'webauthn-devtools', payload });
      } catch {
        // Port might be disconnected
        this.connections.delete(tabId);
      }
    }
  }

  /**
   * Checks if a panel is connected for a tab.
   */
  hasConnection(tabId: number): boolean {
    return this.connections.has(tabId);
  }

  /**
   * Gets all connected tab IDs.
   */
  getConnectedTabs(): number[] {
    return Array.from(this.connections.keys());
  }
}

/**
 * Singleton instance of the connection manager.
 */
export const connectionManager = new ConnectionManager();
