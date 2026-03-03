import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonVariant = 'primary' | 'secondary' | 'danger';
export type ButtonAppearance = 'solid' | 'outline' | 'ghost';
export type ButtonSize = 'lg' | 'md' | 'sm';

export type ButtonProps = ComponentProps<'button'> & {
  /** Semantic variant: primary, secondary, or danger (maps to destructive in styles). */
  variant?: ButtonVariant;
  /** Visual style: solid, outline, or ghost. */
  appearance?: ButtonAppearance;
  /** When true, uses full border-radius for icon-only/pill shape. */
  circular?: boolean;
  /** Size: lg, md, or sm. */
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
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { appearance, circular, className, size, variant, ...props },
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
        size != null && sizeToClass[size],
        className,
      )}
    />
  );
});
