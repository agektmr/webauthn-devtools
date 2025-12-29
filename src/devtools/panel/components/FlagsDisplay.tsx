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
 * Component for displaying authenticator data flags.
 */

import React from 'react';
import type { AuthDataFlags } from '../../../shared/types';
import { formatFlagName } from '../utils/formatters';

interface FlagsDisplayProps {
  flags: AuthDataFlags;
}

const FLAG_ORDER: (keyof Omit<AuthDataFlags, 'raw'>)[] = [
  'UP',
  'UV',
  'BE',
  'BS',
  'AT',
  'ED',
];

export function FlagsDisplay({ flags }: FlagsDisplayProps): React.ReactElement {
  return (
    <div className="flags-display vertical">
      {FLAG_ORDER.map((flag) => (
        <div key={flag} className={`flag-item ${flags[flag] ? 'true' : 'false'}`}>
          <span className="flag-icon">
            {flags[flag] ? '\u2713' : '\u25CB'}
          </span>
          <span className="flag-label">{flag}</span>
          <span className="flag-name">({formatFlagName(flag)})</span>
        </div>
      ))}
    </div>
  );
}
