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
 * Filter bar component for filtering WebAuthn calls.
 */

import React from 'react';
import type { CallType, CallStatus } from '../../../shared/types';

export type FilterType = 'all' | CallType;
export type FilterStatus = 'all' | CallStatus;

interface FilterBarProps {
  searchText: string;
  onSearchChange: (text: string) => void;
  typeFilter: FilterType;
  onTypeChange: (type: FilterType) => void;
  statusFilter: FilterStatus;
  onStatusChange: (status: FilterStatus) => void;
}

export function FilterBar({
  searchText,
  onSearchChange,
  typeFilter,
  onTypeChange,
  statusFilter,
  onStatusChange,
}: FilterBarProps): React.ReactElement {
  return (
    <div className="filter-bar">
      <input
        type="text"
        className="filter-input"
        placeholder="Filter..."
        value={searchText}
        onChange={(e) => onSearchChange(e.target.value)}
      />

      <select
        className="filter-select"
        value={typeFilter}
        onChange={(e) => onTypeChange(e.target.value as FilterType)}
      >
        <option value="all">All Types</option>
        <option value="create">create()</option>
        <option value="get">get()</option>
        <option value="isUserVerifyingPlatformAuthenticatorAvailable">
          isUserVerifyingPlatformAuthenticatorAvailable()
        </option>
        <option value="isConditionalMediationAvailable">isConditionalMediationAvailable()</option>
        <option value="getClientCapabilities">getClientCapabilities()</option>
      </select>

      <select
        className="filter-select"
        value={statusFilter}
        onChange={(e) => onStatusChange(e.target.value as FilterStatus)}
      >
        <option value="all">All Status</option>
        <option value="pending">Pending</option>
        <option value="success">Success</option>
        <option value="error">Error</option>
        <option value="aborted">Aborted</option>
      </select>
    </div>
  );
}
