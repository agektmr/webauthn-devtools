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
 * Toolbar component for the DevTools panel.
 */

import React from 'react';
import type { WebAuthnCall } from '../../../shared/types';
import { downloadExport } from '../utils/export';

interface ToolbarProps {
  calls: WebAuthnCall[];
  onClear: () => void;
  virtualAuthEnabled: boolean;
}

export function Toolbar({
  calls,
  onClear,
  virtualAuthEnabled,
}: ToolbarProps): React.ReactElement {
  const handleExport = () => {
    if (calls.length > 0) {
      downloadExport(calls);
    }
  };

  return (
    <div className="toolbar">
      <span className="toolbar-title">WebAuthn</span>

      <div
        className={`virtual-auth-indicator ${virtualAuthEnabled ? 'enabled' : 'disabled'}`}
      >
        {virtualAuthEnabled ? 'Virtual Auth' : 'No Virtual Auth'}
      </div>

      <div className="toolbar-spacer" />

      <button
        className="toolbar-button"
        onClick={handleExport}
        disabled={calls.length === 0}
        title="Export calls as JSON"
      >
        Export
      </button>

      <button
        className="toolbar-button"
        onClick={onClear}
        disabled={calls.length === 0}
        title="Clear all calls"
      >
        Clear
      </button>
    </div>
  );
}
