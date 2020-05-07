/* eslint-disable */
// @ts-check
import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * SafeAnchor - In all ways similar to a regular anchor tag.
 * The difference is that it sanitizes the href value and prevents XSS
 * @augments {React.PureComponent<React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>>}
 */
class SafeAnchor extends React.PureComponent {
  render() {
    if (!this.props.href) return;
    const href = sanitizeUrl(this.props.href);
    return (
      <a {...this.props} href={href}>
        {this.props.children}
      </a>
    );
  }
}

export default SafeAnchor;
