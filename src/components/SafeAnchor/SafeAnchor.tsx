import React from 'react';

import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 */
export type SafeAnchorProps = {
  /** Set the className for the anchor tag element */
  className?: string;
  /** Set the href attribute for the anchor tag element */
  href?: string;
  /** Set the target attribute for the anchor tag element */
  target?: string;
};

const UnMemoizedSafeAnchor: React.FC<SafeAnchorProps> = (props) => {
  const { children, className, href, target } = props;
  if (!href) return null;
  const sanitized = sanitizeUrl(href);
  return (
    <a className={className} href={sanitized} target={target}>
      {children}
    </a>
  );
};

export const SafeAnchor = React.memo(
  UnMemoizedSafeAnchor,
) as typeof UnMemoizedSafeAnchor;
