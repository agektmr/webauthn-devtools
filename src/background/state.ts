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
 * Per-tab state management for WebAuthn calls.
 */

import type { WebAuthnCall } from '../shared/types';

/**
 * State for a single tab.
 */
export interface TabState {
  calls: WebAuthnCall[];
}

/**
 * Callback for state change notifications.
 */
export type StateChangeCallback = (tabId: number, state: TabState) => void;

/**
 * Manages WebAuthn call state per browser tab.
 */
export class StateManager {
  private state = new Map<number, TabState>();
  private listeners = new Set<StateChangeCallback>();

  /**
   * Gets the state for a tab, creating it if it doesn't exist.
   */
  getState(tabId: number): TabState {
    if (!this.state.has(tabId)) {
      this.state.set(tabId, {
        calls: [],
      });
    }
    return this.state.get(tabId)!;
  }

  /**
   * Gets all calls for a tab.
   */
  getCalls(tabId: number): WebAuthnCall[] {
    const state = this.state.get(tabId);
    return state ? state.calls : [];
  }

  /**
   * Adds a new WebAuthn call to a tab's state.
   */
  addCall(tabId: number, call: WebAuthnCall): void {
    const state = this.getState(tabId);
    state.calls.push(call);
    this.notifyListeners(tabId, state);
  }

  /**
   * Updates an existing call with new data.
   */
  updateCall(
    tabId: number,
    callId: string,
    update: Partial<WebAuthnCall>
  ): void {
    const state = this.getState(tabId);
    const call = state.calls.find((c) => c.id === callId);
    if (call) {
      Object.assign(call, update);
      this.notifyListeners(tabId, state);
    }
  }

  /**
   * Clears all calls for a tab.
   */
  clearCalls(tabId: number): void {
    const state = this.getState(tabId);
    state.calls = [];
    this.notifyListeners(tabId, state);
  }

  /**
   * Deletes all state for a tab.
   */
  deleteTab(tabId: number): void {
    this.state.delete(tabId);
  }

  /**
   * Adds a listener for state changes.
   */
  addListener(callback: StateChangeCallback): void {
    this.listeners.add(callback);
  }

  /**
   * Removes a state change listener.
   */
  removeListener(callback: StateChangeCallback): void {
    this.listeners.delete(callback);
  }

  /**
   * Notifies all listeners of a state change.
   */
  private notifyListeners(tabId: number, state: TabState): void {
    for (const listener of this.listeners) {
      listener(tabId, state);
    }
  }
}

/**
 * Singleton instance of the state manager.
 */
export const stateManager = new StateManager();
