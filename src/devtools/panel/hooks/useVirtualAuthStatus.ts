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
 * Hook for checking virtual authenticator status.
 */

import { useState, useEffect } from 'react';
import type { VirtualAuthenticator } from '../../../shared/types';

interface UseVirtualAuthStatusResult {
  enabled: boolean;
  authenticators: VirtualAuthenticator[];
  loading: boolean;
  refresh: () => void;
}

/**
 * Hook that queries the background for virtual authenticator status.
 */
export function useVirtualAuthStatus(): UseVirtualAuthStatusResult {
  const [enabled, setEnabled] = useState(false);
  const [authenticators, setAuthenticators] = useState<VirtualAuthenticator[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  const refresh = () => {
    const tabId = browser.devtools.inspectedWindow.tabId;
    setLoading(true);

    browser.runtime.sendMessage(
      {
        source: 'webauthn-devtools',
        tabId,
        payload: { type: 'GET_VIRTUAL_AUTH_STATUS', tabId },
      },
      (
        response:
          | { enabled: boolean; authenticators: VirtualAuthenticator[] }
          | undefined
      ) => {
        if (response) {
          setEnabled(response.enabled);
          setAuthenticators(response.authenticators);
        }
        setLoading(false);
      }
    );
  };

  useEffect(() => {
    refresh();
  }, []);

  return { enabled, authenticators, loading, refresh };
}
