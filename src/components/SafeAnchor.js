import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @extends PureComponent
 */
export class SafeAnchor extends React.PureComponent {
  render() {
    const href = sanitizeUrl(this.props.href);
    return (
      <a {...this.props} href={href}>
        {this.props.children}
      </a>
    );
  }
}
