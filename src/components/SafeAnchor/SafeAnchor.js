// @ts-check
import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @type {React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>}
 */
const SafeAnchor = ({ href, children }) => {
  if (!href) return null;
  const sanitized = sanitizeUrl(href);
  return <a href={sanitized}>{children}</a>;
};

export default React.memo(SafeAnchor);
