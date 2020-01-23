import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 */

export const SafeAnchor = (props) => (
  <a {...props} href={sanitizeUrl(props.href)}>
    {props.children}
  </a>
);
