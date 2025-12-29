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
 * Call list component showing all WebAuthn calls.
 */

import React from 'react';
import type { WebAuthnCall } from '../../../shared/types';
import { formatTime, formatDuration, formatCallType } from '../utils/formatters';

interface CallListProps {
  calls: WebAuthnCall[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function CallList({
  calls,
  selectedId,
  onSelect,
}: CallListProps): React.ReactElement {
  if (calls.length === 0) {
    return (
      <div className="call-list">
        <div className="call-list-header">Calls</div>
        <div className="call-list-empty">No WebAuthn calls captured</div>
      </div>
    );
  }

  return (
    <div className="call-list">
      <div className="call-list-header">
        {calls.length} call{calls.length !== 1 ? 's' : ''}
      </div>
      <div className="call-list-items">
        {calls.map((call) => (
          <CallItem
            key={call.id}
            call={call}
            selected={call.id === selectedId}
            onClick={() => onSelect(call.id)}
          />
        ))}
      </div>
    </div>
  );
}

interface CallItemProps {
  call: WebAuthnCall;
  selected: boolean;
  onClick: () => void;
}

function CallItem({
  call,
  selected,
  onClick,
}: CallItemProps): React.ReactElement {
  const typeClass =
    call.type === 'create' || call.type === 'get' ? call.type : '';

  return (
    <div
      className={`call-item ${selected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className={`call-item-status ${call.status}`} />
      <div className="call-item-content">
        <div className={`call-item-type ${typeClass}`}>
          {formatCallType(call.type)}
        </div>
        <div className="call-item-meta">
          <span>{formatTime(call.timestamp)}</span>
          {call.duration !== undefined && (
            <span className="call-item-duration">
              {formatDuration(call.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
