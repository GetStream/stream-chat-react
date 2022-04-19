import React, { PropsWithChildren } from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

/**
 * Similar to a regular anchor tag, but it sanitizes the href value and prevents XSS
 */
export type SafeAnchorProps = {
  /** Set the className for the anchor tag element */
  className?: string;
  /** Specifies that the target (href attribute) will be downloaded instead of navigating to a file */
  download?: boolean;
  /** Set the href attribute for the anchor tag element */
  href?: string;
  /** Set the rel attribute for the anchor tag element */
  rel?: string;
  /** Set the target attribute for the anchor tag element */
  target?: string;
};

const UnMemoizedSafeAnchor = (props: PropsWithChildren<SafeAnchorProps>) => {
  const { children, className, download, href, rel, target } = props;
  if (!href) return null;
  const sanitized = sanitizeUrl(href);
  return (
    <a
      aria-label='Attachment'
      className={className}
      download={download}
      href={sanitized}
      rel={rel}
      target={target}
    >
      {children}
    </a>
  );
};

export const SafeAnchor = React.memo(UnMemoizedSafeAnchor) as typeof UnMemoizedSafeAnchor;
