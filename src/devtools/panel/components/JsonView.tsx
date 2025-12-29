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
 * JSON viewer component with collapsible sections.
 */

import React, { useState } from 'react';

interface JsonViewProps {
  data: unknown;
  initialExpanded?: boolean;
}

export function JsonView({
  data,
  initialExpanded = true,
}: JsonViewProps): React.ReactElement {
  return (
    <div className="json-view">
      <JsonValue value={data} initialExpanded={initialExpanded} />
    </div>
  );
}

interface JsonValueProps {
  value: unknown;
  initialExpanded?: boolean;
}

function JsonValue({
  value,
  initialExpanded = true,
}: JsonValueProps): React.ReactElement {
  if (value === null) {
    return <span className="json-null">null</span>;
  }

  if (value === undefined) {
    return <span className="json-null">undefined</span>;
  }

  if (typeof value === 'boolean') {
    return <span className="json-boolean">{value.toString()}</span>;
  }

  if (typeof value === 'number') {
    return <span className="json-number">{value}</span>;
  }

  if (typeof value === 'string') {
    return <span className="json-string">"{value}"</span>;
  }

  if (Array.isArray(value)) {
    return <JsonArray value={value} initialExpanded={initialExpanded} />;
  }

  if (typeof value === 'object') {
    return (
      <JsonObject
        value={value as Record<string, unknown>}
        initialExpanded={initialExpanded}
      />
    );
  }

  return <span>{String(value)}</span>;
}

interface JsonArrayProps {
  value: unknown[];
  initialExpanded: boolean;
}

function JsonArray({
  value,
  initialExpanded,
}: JsonArrayProps): React.ReactElement {
  const [expanded, setExpanded] = useState(initialExpanded);

  if (value.length === 0) {
    return <span className="json-bracket">[]</span>;
  }

  if (!expanded) {
    return (
      <span className="json-toggle" onClick={() => setExpanded(true)}>
        <span className="json-bracket">[</span>
        <span className="json-collapsed">{value.length} items</span>
        <span className="json-bracket">]</span>
      </span>
    );
  }

  return (
    <span>
      <span
        className="json-bracket json-toggle"
        onClick={() => setExpanded(false)}
      >
        [
      </span>
      <div style={{ paddingLeft: '16px' }}>
        {value.map((item, index) => (
          <div key={index}>
            <JsonValue value={item} initialExpanded={false} />
            {index < value.length - 1 && ','}
          </div>
        ))}
      </div>
      <span className="json-bracket">]</span>
    </span>
  );
}

interface JsonObjectProps {
  value: Record<string, unknown>;
  initialExpanded: boolean;
}

function JsonObject({
  value,
  initialExpanded,
}: JsonObjectProps): React.ReactElement {
  const [expanded, setExpanded] = useState(initialExpanded);
  const keys = Object.keys(value);

  if (keys.length === 0) {
    return <span className="json-bracket">{'{}'}</span>;
  }

  if (!expanded) {
    return (
      <span className="json-toggle" onClick={() => setExpanded(true)}>
        <span className="json-bracket">{'{'}</span>
        <span className="json-collapsed">{keys.length} properties</span>
        <span className="json-bracket">{'}'}</span>
      </span>
    );
  }

  return (
    <span>
      <span
        className="json-bracket json-toggle"
        onClick={() => setExpanded(false)}
      >
        {'{'}
      </span>
      <div style={{ paddingLeft: '16px' }}>
        {keys.map((key, index) => (
          <div key={key}>
            <span className="json-key">"{key}"</span>
            <span className="json-bracket">: </span>
            <JsonValue value={value[key]} initialExpanded={false} />
            {index < keys.length - 1 && ','}
          </div>
        ))}
      </div>
      <span className="json-bracket">{'}'}</span>
    </span>
  );
}
