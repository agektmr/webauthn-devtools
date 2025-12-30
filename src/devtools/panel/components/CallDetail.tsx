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
 * Call detail component showing request/response details.
 */

import React, { useState, useMemo } from 'react';
import type {
  WebAuthnCall,
  CreateResponse,
  GetResponse,
} from '../../../shared/types';
import { formatCallType, formatDuration } from '../utils/formatters';
import { JsonView } from './JsonView';
import { FlagsDisplay } from './FlagsDisplay';
import {
  parseClientData,
  parseAttestationObject,
  parseAuthData,
} from '../../../parsers';
import { base64UrlToArrayBuffer } from '../../../injected/serializer';
import { lookupAAGUID, isZeroAAGUID } from '../../../shared/aaguid-lookup';

interface CallDetailProps {
  call: WebAuthnCall | null;
}

type Tab = 'request' | 'response';

export function CallDetail({ call }: CallDetailProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<Tab>('request');

  if (!call) {
    return (
      <div className="call-detail">
        <div className="call-detail-empty">Select a call to view details</div>
      </div>
    );
  }

  return (
    <div className="call-detail">
      <div className="call-detail-header">
        <span className="call-detail-title">{formatCallType(call.type)}</span>
        <span className={`call-detail-status ${call.status}`}>
          {call.status}
        </span>
        {call.duration !== undefined && (
          <span style={{ color: 'var(--text-secondary)' }}>
            {formatDuration(call.duration)}
          </span>
        )}
      </div>

      <div className="call-detail-tabs">
        <button
          className={`call-detail-tab ${activeTab === 'request' ? 'active' : ''}`}
          onClick={() => setActiveTab('request')}
        >
          Request
        </button>
        <button
          className={`call-detail-tab ${activeTab === 'response' ? 'active' : ''}`}
          onClick={() => setActiveTab('response')}
        >
          Response
        </button>
      </div>

      <div className="call-detail-content">
        {activeTab === 'request' && <RequestView call={call} />}
        {activeTab === 'response' && <ResponseView call={call} />}
      </div>
    </div>
  );
}

function RequestView({ call }: { call: WebAuthnCall }): React.ReactElement {
  return (
    <div className="section">
      <div className="section-title">Request Options</div>
      <JsonView data={call.request} />
    </div>
  );
}

function ResponseView({ call }: { call: WebAuthnCall }): React.ReactElement {
  if (call.status === 'pending') {
    return <div className="section">Waiting for response...</div>;
  }

  if (call.status === 'aborted') {
    return <div className="section">Call was aborted</div>;
  }

  if (call.status === 'error' && call.error) {
    return (
      <div className="error-display">
        <div className="error-name">{call.error.name}</div>
        <div className="error-message">{call.error.message}</div>
        {call.error.stack && (
          <pre className="error-stack">{call.error.stack}</pre>
        )}
      </div>
    );
  }

  if (!call.response) {
    return <div className="section">No response data</div>;
  }

  // For create/get calls, show response with inline parsed data
  if (call.type === 'create' && call.status === 'success') {
    return <CreateResponseView response={call.response as CreateResponse} />;
  }

  if (call.type === 'get' && call.status === 'success') {
    return <GetResponseView response={call.response as GetResponse} />;
  }

  // For other calls (static methods), show raw response
  return (
    <div className="section">
      <div className="section-title">Response</div>
      <JsonView data={call.response} />
    </div>
  );
}

function CreateResponseView({ response }: { response: CreateResponse }): React.ReactElement {
  const parsed = useMemo(() => {
    try {
      const result: {
        clientData?: ReturnType<typeof parseClientData>;
        attestation?: ReturnType<typeof parseAttestationObject>;
      } = {};

      if (response.response.clientDataJSON) {
        result.clientData = parseClientData(response.response.clientDataJSON);
      }

      if (response.response.attestationObject) {
        const attestationBuffer = base64UrlToArrayBuffer(
          response.response.attestationObject
        );
        result.attestation = parseAttestationObject(attestationBuffer);
      }

      return result;
    } catch (error) {
      console.error('Failed to parse create response:', error);
      return null;
    }
  }, [response]);

  return (
    <div className="section">
      <div className="section-title">Attestation Credential</div>
      <div className="response-tree">
        <JsonProperty name="id" value={response.id} />
        <JsonProperty name="rawId" value={response.rawId} />
        <JsonProperty name="type" value={response.type} />
        {response.authenticatorAttachment && (
          <JsonProperty name="authenticatorAttachment" value={response.authenticatorAttachment} />
        )}

        <div className="json-property">
          <span className="json-key">response:</span>
          <div className="json-nested">
            <JsonProperty name="clientDataJSON" value={response.response.clientDataJSON} />
            {parsed?.clientData && (
              <ParsedBlock title="clientData (parsed)">
                <JsonView data={parsed.clientData} />
              </ParsedBlock>
            )}

            <JsonProperty name="attestationObject" value={response.response.attestationObject} />
            {parsed?.attestation && (
              <ParsedBlock title="attestation (parsed)">
                <div className="parsed-content">
                  <JsonProperty name="fmt" value={parsed.attestation.fmt} />
                  <JsonProperty name="attStmt" value={parsed.attestation.attStmt} isObject />
                  <div className="json-property">
                    <span className="json-key">authData:</span>
                    <div className="json-nested">
                      <JsonProperty name="rpIdHash" value={parsed.attestation.authData.rpIdHash} />
                      <div className="json-property">
                        <span className="json-key">flags:</span>
                        <FlagsDisplay flags={parsed.attestation.authData.flags} />
                      </div>
                      <JsonProperty name="signCount" value={parsed.attestation.authData.signCount} />
                      {parsed.attestation.authData.attestedCredentialData && (
                        <div className="json-property">
                          <span className="json-key">attestedCredentialData:</span>
                          <div className="json-nested">
                            <AAGUIDDisplay aaguid={parsed.attestation.authData.attestedCredentialData.aaguid} />
                            <JsonProperty name="credentialId" value={parsed.attestation.authData.attestedCredentialData.credentialId} />
                            <JsonProperty name="publicKey" value={parsed.attestation.authData.attestedCredentialData.publicKey} isObject />
                          </div>
                        </div>
                      )}
                      {parsed.attestation.authData.extensions && (
                        <JsonProperty name="extensions" value={parsed.attestation.authData.extensions} isObject />
                      )}
                    </div>
                  </div>
                </div>
              </ParsedBlock>
            )}

            {response.response.transports && (
              <JsonProperty name="transports" value={response.response.transports} isObject />
            )}
          </div>
        </div>

        <JsonProperty name="clientExtensionResults" value={response.clientExtensionResults} isObject />
      </div>
    </div>
  );
}

function GetResponseView({ response }: { response: GetResponse }): React.ReactElement {
  const parsed = useMemo(() => {
    try {
      const result: {
        clientData?: ReturnType<typeof parseClientData>;
        authData?: ReturnType<typeof parseAuthData>;
      } = {};

      if (response.response.clientDataJSON) {
        result.clientData = parseClientData(response.response.clientDataJSON);
      }

      if (response.response.authenticatorData) {
        const authDataBuffer = base64UrlToArrayBuffer(
          response.response.authenticatorData
        );
        result.authData = parseAuthData(authDataBuffer);
      }

      return result;
    } catch (error) {
      console.error('Failed to parse get response:', error);
      return null;
    }
  }, [response]);

  return (
    <div className="section">
      <div className="section-title">Assertion Credential</div>
      <div className="response-tree">
        <JsonProperty name="id" value={response.id} />
        <JsonProperty name="rawId" value={response.rawId} />
        <JsonProperty name="type" value={response.type} />
        {response.authenticatorAttachment && (
          <JsonProperty name="authenticatorAttachment" value={response.authenticatorAttachment} />
        )}

        <div className="json-property">
          <span className="json-key">response:</span>
          <div className="json-nested">
            <JsonProperty name="clientDataJSON" value={response.response.clientDataJSON} />
            {parsed?.clientData && (
              <ParsedBlock title="clientData (parsed)">
                <JsonView data={parsed.clientData} />
              </ParsedBlock>
            )}

            <JsonProperty name="authenticatorData" value={response.response.authenticatorData} />
            {parsed?.authData && (
              <ParsedBlock title="authData (parsed)">
                <div className="parsed-content">
                  <JsonProperty name="rpIdHash" value={parsed.authData.rpIdHash} />
                  <div className="json-property">
                    <span className="json-key">flags:</span>
                    <FlagsDisplay flags={parsed.authData.flags} />
                  </div>
                  <JsonProperty name="signCount" value={parsed.authData.signCount} />
                  {parsed.authData.extensions && (
                    <JsonProperty name="extensions" value={parsed.authData.extensions} isObject />
                  )}
                </div>
              </ParsedBlock>
            )}

            <JsonProperty name="signature" value={response.response.signature} />
            {response.response.userHandle && (
              <JsonProperty name="userHandle" value={response.response.userHandle} />
            )}
          </div>
        </div>

        <JsonProperty name="clientExtensionResults" value={response.clientExtensionResults} isObject />
      </div>
    </div>
  );
}

interface JsonPropertyProps {
  name: string;
  value: unknown;
  isObject?: boolean;
}

function JsonProperty({ name, value, isObject }: JsonPropertyProps): React.ReactElement {
  if (isObject) {
    return (
      <div className="json-property">
        <span className="json-key">{name}:</span>
        <JsonView data={value} />
      </div>
    );
  }

  const displayValue = typeof value === 'string' && value.length > 50
    ? `"${value.substring(0, 50)}..."`
    : JSON.stringify(value);

  return (
    <div className="json-property">
      <span className="json-key">{name}:</span>
      <span className={`json-value ${typeof value}`}>{displayValue}</span>
    </div>
  );
}

interface ParsedBlockProps {
  title: string;
  children: React.ReactNode;
}

function ParsedBlock({ title, children }: ParsedBlockProps): React.ReactElement {
  return (
    <div className="parsed-block">
      <div className="parsed-block-title">{title}</div>
      <div className="parsed-block-content">
        {children}
      </div>
    </div>
  );
}

interface AAGUIDDisplayProps {
  aaguid: string;
}

function AAGUIDDisplay({ aaguid }: AAGUIDDisplayProps): React.ReactElement {
  const metadata = lookupAAGUID(aaguid);
  const isZero = isZeroAAGUID(aaguid);

  return (
    <div className="json-property aaguid-display">
      <span className="json-key">aaguid:</span>
      <span className="json-value string">"{aaguid}"</span>
      {metadata && (
        <span className="aaguid-name">
          {metadata.icon_dark && (
            <img
              src={metadata.icon_dark}
              alt={metadata.name}
              className="aaguid-icon"
            />
          )}
          {metadata.name}
        </span>
      )}
      {isZero && !metadata && (
        <span className="aaguid-name aaguid-unknown">
          (Unknown / Virtual Authenticator)
        </span>
      )}
    </div>
  );
}
