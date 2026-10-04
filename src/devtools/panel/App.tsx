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
 * Main application component for the DevTools panel.
 */

import React, { useState, useMemo } from 'react';
import { Toolbar } from './components/Toolbar';
import { FilterBar, FilterType, FilterStatus } from './components/FilterBar';
import { CallList } from './components/CallList';
import { CallDetail } from './components/CallDetail';
import { useWebAuthnCalls } from './hooks/useWebAuthnCalls';

function App(): React.ReactElement {
  const { calls, selectedCall, selectCall, clearCalls } = useWebAuthnCalls();

  const [searchText, setSearchText] = useState('');
  const [typeFilter, setTypeFilter] = useState<FilterType>('all');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');

  const filteredCalls = useMemo(() => {
    return calls.filter((call) => {
      // Type filter
      if (typeFilter !== 'all' && call.type !== typeFilter) {
        return false;
      }

      // Status filter
      if (statusFilter !== 'all' && call.status !== statusFilter) {
        return false;
      }

      // Search filter
      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesType = call.type.toLowerCase().includes(search);
        const matchesRequest = JSON.stringify(call.request)
          .toLowerCase()
          .includes(search);
        const matchesResponse = call.response
          ? JSON.stringify(call.response).toLowerCase().includes(search)
          : false;
        if (!matchesType && !matchesRequest && !matchesResponse) {
          return false;
        }
      }

      return true;
    });
  }, [calls, typeFilter, statusFilter, searchText]);

  return (
    <div className="app">
      <Toolbar
        calls={calls}
        onClear={clearCalls}
      />
      <FilterBar
        searchText={searchText}
        onSearchChange={setSearchText}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
      />
      <div className="main-content">
        <CallList
          calls={filteredCalls}
          selectedId={selectedCall?.id || null}
          onSelect={selectCall}
        />
        <CallDetail call={selectedCall} />
      </div>
    </div>
  );
}

export default App;
