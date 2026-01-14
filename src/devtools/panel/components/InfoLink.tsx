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
 * InfoLink component for displaying documentation links with tooltips.
 */

import React, { useState, useRef, useLayoutEffect } from 'react';
import { getDocLink, type DocLink } from '../utils/docLinks';

interface InfoLinkProps {
  /** The key to look up documentation for */
  docKey: string;
  /** Optional override for the documentation link */
  docLink?: DocLink;
}

/**
 * A small info icon that displays a tooltip with documentation link on hover.
 */
export function InfoLink({ docKey, docLink: overrideDocLink }: InfoLinkProps): React.ReactElement | null {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<'above' | 'below'>('below');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties | null>(null);
  const iconRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const link = overrideDocLink ?? getDocLink(docKey);

  // Calculate tooltip position based on available space
  useLayoutEffect(() => {
    if (isVisible && iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const tooltipWidth = 220;

      // Calculate horizontal position (centered on icon, but constrained to viewport)
      let left = rect.left + rect.width / 2 - tooltipWidth / 2;
      left = Math.max(8, Math.min(left, window.innerWidth - tooltipWidth - 8));

      // Prefer showing below, but switch to above if not enough space
      if (spaceBelow < 120 && spaceAbove > spaceBelow) {
        setPosition('above');
        setTooltipStyle({
          position: 'fixed',
          left: left,
          bottom: window.innerHeight - rect.top + 6,
        });
      } else {
        setPosition('below');
        setTooltipStyle({
          position: 'fixed',
          left: left,
          top: rect.bottom + 6,
        });
      }
    } else {
      // Reset position when hiding
      setTooltipStyle(null);
    }
  }, [isVisible]);

  if (!link) {
    return null;
  }

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(link.url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      window.open(link.url, '_blank', 'noopener,noreferrer');
    }
  };

  // Only show tooltip when position is calculated
  const showTooltip = isVisible && tooltipStyle !== null;

  return (
    <span className="info-link-container">
      <span
        ref={iconRef}
        className="info-link"
        role="button"
        tabIndex={0}
        aria-label={`Learn more about ${link.label}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
      >
        ⓘ
      </span>
      {showTooltip && (
        <div
          ref={tooltipRef}
          className={`info-tooltip ${position}`}
          style={tooltipStyle}
          role="tooltip"
        >
          <div className="info-tooltip-title">{link.label}</div>
          <div className="info-tooltip-description">{link.description}</div>
          <div className="info-tooltip-link">
            <span className="info-tooltip-link-text">Learn more</span>
            <span className="info-tooltip-external-icon">↗</span>
          </div>
        </div>
      )}
    </span>
  );
}

/**
 * Wrapper component that adds an info link after a property name.
 */
interface DocPropertyProps {
  /** Property name to display */
  name: string;
  /** Key to look up documentation (defaults to name) */
  docKey?: string;
  /** Children to render after the property name */
  children?: React.ReactNode;
}

export function DocProperty({ name, docKey, children }: DocPropertyProps): React.ReactElement {
  return (
    <>
      <span className="json-key">{name}:</span>
      <InfoLink docKey={docKey ?? name} />
      {children}
    </>
  );
}
