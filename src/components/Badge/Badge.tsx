import clsx from 'clsx';
import React, { type ComponentProps } from 'react';
import { IconExclamationMarkFill } from '../Icons';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'error'
  | 'neutral'
  | 'counter'
  | 'inverse';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | null;

export type BadgeProps = ComponentProps<'div'> & {
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
  <div
    {...spanProps}
    className={clsx(
      'str-chat__badge',
      `str-chat__badge--variant-${variant}`,
      { [`str-chat__badge--size-${size}`]: size },
      className,
    )}
  >
    {children}
  </div>
);

export const ErrorBadge = ({
  className,
  size = 'sm',
  ...rest
}: Omit<BadgeProps, 'variant'>) => (
  <Badge {...rest} className={className} size={size} variant='error'>
    <IconExclamationMarkFill />
  </Badge>
);
