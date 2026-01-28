import type { ComponentProps } from 'react';
import clsx from 'clsx';

export type ButtonProps = ComponentProps<'button'>;

export const Button = ({ className, ...props }: ButtonProps) => (
  <button type='button' {...props} className={clsx('str-chat__button', className)} />
);
