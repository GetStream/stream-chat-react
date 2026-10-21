import React, { type ComponentProps, forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonAppearance = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm' | 'xs';

export type ButtonProps = ComponentProps<'button'> & {
  /** The `'danger'` variant uses the destructive styling. */
  variant?: ButtonVariant;
  appearance?: ButtonAppearance;
  /** Uses a full border radius, for icon-only or pill buttons. */
  circular?: boolean;
  /** Applies the inverse theme, e.g. for a dark surface in the light theme. */
  inverseTheme?: boolean;
  size?: ButtonSize;
};

const variantToClass: Record<ButtonVariant, string> = {
  danger: 'str-chat__button--destructive',
  primary: 'str-chat__button--primary',
  secondary: 'str-chat__button--secondary',
};

const appearanceToClass: Record<ButtonAppearance, string> = {
  ghost: 'str-chat__button--ghost',
  outline: 'str-chat__button--outline',
  solid: 'str-chat__button--solid',
};

const sizeToClass: Record<ButtonSize, string> = {
  lg: 'str-chat__button--size-lg',
  md: 'str-chat__button--size-md',
  sm: 'str-chat__button--size-sm',
  xs: 'str-chat__button--size-xs',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { appearance, children, circular, className, inverseTheme, size, variant, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type='button'
      {...props}
      className={clsx(
        'str-chat__button',
        variant != null && variantToClass[variant],
        appearance != null && appearanceToClass[appearance],
        circular && 'str-chat__button--circular',
        inverseTheme && 'str-chat__theme-inverse',
        size != null && sizeToClass[size],
        className,
      )}
    >
      <div className='str-chat__button__content'>{children}</div>
    </button>
  );
});
