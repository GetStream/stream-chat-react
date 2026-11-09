import type { PropsWithChildren } from 'react';
import React from 'react';
import { sanitizeUrl } from '@braintree/sanitize-url';

export type SafeAnchorProps = {
  className?: string;
  /** Downloads the file at `href` instead of navigating to it. */
  download?: boolean;
  /** Sanitized before it is rendered. The component renders nothing when it is empty. */
  href?: string;
  rel?: string;
  target?: string;
};

const UnMemoizedSafeAnchor = (props: PropsWithChildren<SafeAnchorProps>) => {
  const { children, className, download, href, rel, target } = props;
  if (!href) return null;
  const sanitized = sanitizeUrl(href);
  return (
    <a
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

/** Anchor that sanitizes `href` to prevent XSS. */
export const SafeAnchor = React.memo(UnMemoizedSafeAnchor) as typeof UnMemoizedSafeAnchor;
