import clsx from 'clsx';
import React, { type ComponentProps } from 'react';

export type BadgeVariant = 'default' | 'primary' | 'error' | 'neutral' | 'inverse';

export type BadgeSize = 'sm' | 'md' | 'lg';

export type BadgeProps = ComponentProps<'span'> & {
  /** Visual variant mapping to design tokens */
  variant?: BadgeVariant;
  /** Size preset (typography and padding) */
  size?: BadgeSize;
};

/**
 * Compact pill/circle badge for counts and labels.
 * Uses design tokens: --badge-bg-*, --badge-text-*, --badge-border.
 */
export const Badge = ({
  children,
  className,
  size = 'md',
  variant = 'default',
  ...spanProps
}: BadgeProps) => (
  <span
    {...spanProps}
    className={clsx(
      'str-chat__badge',
      `str-chat__badge--variant-${variant}`,
      `str-chat__badge--size-${size}`,
      className,
    )}
  >
    {children}
  </span>
);
