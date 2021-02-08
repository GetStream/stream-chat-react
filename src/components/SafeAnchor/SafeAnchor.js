// @ts-check
import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @type {React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>>}
 */
const SafeAnchor = ({ children, className, href, target }) => {
  if (!href) return null;
  const sanitized = sanitizeUrl(href);
  return (
    <a className={className} href={sanitized} target={target}>
      {children}
    </a>
  );
};

export default React.memo(SafeAnchor);
