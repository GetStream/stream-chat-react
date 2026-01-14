import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const Button = ({ className, ...props }: ComponentProps<'button'>) => (
  <button {...props} className={clsx('str-chat__button', className)} />
);
