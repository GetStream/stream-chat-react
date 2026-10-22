import clsx from 'clsx';
import React, { type ComponentProps } from 'react';
import { useComponentContextIcons } from '../../context';

export type BadgeVariant =
  | 'default'
  | 'primary'
  | 'error'
  | 'neutral'
  | 'counter'
  | 'inverse';

export type BadgeSize = 'xs' | 'sm' | 'md' | 'lg' | null;

export type BadgeProps = ComponentProps<'div'> & {
  variant?: BadgeVariant;
  /** Size preset for typography and padding. Defaults to `'md'`. */
  size?: BadgeSize;
};

/**
 * Compact pill or circle badge for counts and labels, colored by the `--str-chat__badge-bg-*`,
 * `--str-chat__badge-text*` and `--str-chat__badge-border` tokens.
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
}: Omit<BadgeProps, 'variant'>) => {
  const { IconExclamationMarkFill } = useComponentContextIcons();

  return (
    <Badge {...rest} className={className} size={size} variant='error'>
      <IconExclamationMarkFill />
    </Badge>
  );
};
