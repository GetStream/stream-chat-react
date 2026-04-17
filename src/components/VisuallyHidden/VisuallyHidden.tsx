import React, { type ComponentPropsWithoutRef, type CSSProperties } from 'react';

export type VisuallyHiddenProps = ComponentPropsWithoutRef<'span'>;

const visuallyHiddenStyle: CSSProperties = {
  border: 0,
  clip: 'rect(0, 0, 0, 0)',
  height: '1px',
  margin: '-1px',
  overflow: 'hidden',
  padding: 0,
  position: 'absolute',
  whiteSpace: 'nowrap',
  width: '1px',
};

/**
 * Hides content visually while preserving it for assistive technologies.
 */
export const VisuallyHidden = ({ children, style, ...rest }: VisuallyHiddenProps) => (
  <span {...rest} style={{ ...visuallyHiddenStyle, ...style }}>
    {children}
  </span>
);
