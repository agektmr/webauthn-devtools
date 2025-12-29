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

import { vi } from 'vitest';

/**
 * Mock Chrome Extension APIs for testing
 */

// Mock chrome.runtime
const mockRuntime = {
  sendMessage: vi.fn(),
  onMessage: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  connect: vi.fn(() => ({
    postMessage: vi.fn(),
    onMessage: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    onDisconnect: {
      addListener: vi.fn(),
      removeListener: vi.fn(),
    },
    disconnect: vi.fn(),
  })),
  onConnect: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  getURL: vi.fn((path: string) => `chrome-extension://mock-id/${path}`),
};

// Mock chrome.devtools
const mockDevtools = {
  inspectedWindow: {
    tabId: 1,
  },
  panels: {
    create: vi.fn(),
  },
};

// Mock chrome.debugger
const mockDebugger = {
  attach: vi.fn(),
  detach: vi.fn(),
  sendCommand: vi.fn(),
  onEvent: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onDetach: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Mock chrome.tabs
const mockTabs = {
  onRemoved: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
  onUpdated: {
    addListener: vi.fn(),
    removeListener: vi.fn(),
  },
};

// Assign mocks to global chrome object
const chromeMock = {
  runtime: mockRuntime,
  devtools: mockDevtools,
  debugger: mockDebugger,
  tabs: mockTabs,
};

// @ts-expect-error - Mocking global chrome object
globalThis.chrome = chromeMock;

// Export mocks for test assertions
export { mockRuntime, mockDevtools, mockDebugger, mockTabs };

/**
 * Reset all mocks before each test
 */
beforeEach(() => {
  vi.clearAllMocks();
});
