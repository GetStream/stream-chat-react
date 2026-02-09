import type { ComponentProps } from 'react';
import { forwardRef } from 'react';
import clsx from 'clsx';

export type ButtonProps = ComponentProps<'button'>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type='button'
      {...props}
      className={clsx('str-chat__button', className)}
    />
  );
});
