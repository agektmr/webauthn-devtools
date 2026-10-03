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

import { describe, it, expect, beforeEach } from 'vitest';
import { StateManager } from '../../src/background/state';
import type { WebAuthnCall } from '../../src/shared/types';

describe('StateManager', () => {
  let stateManager: StateManager;

  // Factory function to create fresh sample calls
  const createSampleCall = (id = 'test-id-1'): WebAuthnCall => ({
    id,
    type: 'create',
    status: 'pending',
    timestamp: Date.now(),
    request: {
      rp: { id: 'example.com', name: 'Example' },
      user: { id: 'dXNlci0x', name: 'user@example.com', displayName: 'User' },
      challenge: 'Y2hhbGxlbmdl',
      pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
    },
  });

  beforeEach(() => {
    stateManager = new StateManager();
  });

  describe('getState', () => {
    it('should return empty state for new tab', () => {
      const state = stateManager.getState(1);
      expect(state.calls).toEqual([]);
    });

    it('should return same state for same tab', () => {
      const state1 = stateManager.getState(1);
      const state2 = stateManager.getState(1);
      expect(state1).toBe(state2);
    });

    it('should return different state for different tabs', () => {
      const state1 = stateManager.getState(1);
      const state2 = stateManager.getState(2);
      expect(state1).not.toBe(state2);
    });
  });

  describe('addCall', () => {
    it('should add call to correct tab', () => {
      const call = createSampleCall();
      stateManager.addCall(1, call);
      const state = stateManager.getState(1);
      expect(state.calls).toHaveLength(1);
      expect(state.calls[0].id).toBe(call.id);
    });

    it('should not affect other tabs', () => {
      stateManager.addCall(1, createSampleCall());
      const state2 = stateManager.getState(2);
      expect(state2.calls).toHaveLength(0);
    });

    it('should add multiple calls', () => {
      stateManager.addCall(1, createSampleCall('test-id-1'));
      stateManager.addCall(1, createSampleCall('test-id-2'));
      const state = stateManager.getState(1);
      expect(state.calls).toHaveLength(2);
    });
  });

  describe('updateCall', () => {
    it('should update existing call', () => {
      const call = createSampleCall();
      stateManager.addCall(1, call);
      stateManager.updateCall(1, call.id, {
        status: 'success',
        duration: 100,
      });
      const state = stateManager.getState(1);
      expect(state.calls[0].status).toBe('success');
      expect(state.calls[0].duration).toBe(100);
    });

    it('should not affect other calls', () => {
      const call1 = createSampleCall('test-id-1');
      const call2 = createSampleCall('test-id-2');
      stateManager.addCall(1, call1);
      stateManager.addCall(1, call2);
      stateManager.updateCall(1, call1.id, { status: 'success' });
      const state = stateManager.getState(1);
      expect(state.calls[0].status).toBe('success');
      expect(state.calls[1].status).toBe('pending');
    });

    it('should do nothing if call not found', () => {
      const call = createSampleCall();
      stateManager.addCall(1, call);
      stateManager.updateCall(1, 'non-existent', { status: 'error' });
      const state = stateManager.getState(1);
      expect(state.calls[0].status).toBe('pending');
    });
  });

  describe('clearCalls', () => {
    it('should clear all calls for tab', () => {
      stateManager.addCall(1, createSampleCall('test-id-1'));
      stateManager.addCall(1, createSampleCall('test-id-2'));
      stateManager.clearCalls(1);
      const state = stateManager.getState(1);
      expect(state.calls).toHaveLength(0);
    });

    it('should not affect other tabs', () => {
      stateManager.addCall(1, createSampleCall('test-id-1'));
      stateManager.addCall(2, createSampleCall('test-id-2'));
      stateManager.clearCalls(1);
      const state2 = stateManager.getState(2);
      expect(state2.calls).toHaveLength(1);
    });
  });

  describe('deleteTab', () => {
    it('should remove tab state entirely', () => {
      stateManager.addCall(1, createSampleCall());
      stateManager.deleteTab(1);
      // Getting state again should return fresh state
      const state = stateManager.getState(1);
      expect(state.calls).toHaveLength(0);
    });
  });

  describe('getCalls', () => {
    it('should return calls for tab', () => {
      const call = createSampleCall();
      stateManager.addCall(1, call);
      const calls = stateManager.getCalls(1);
      expect(calls).toHaveLength(1);
      expect(calls[0].id).toBe(call.id);
    });

    it('should return empty array for non-existent tab', () => {
      const calls = stateManager.getCalls(999);
      expect(calls).toEqual([]);
    });
  });
});
