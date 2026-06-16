import clsx from 'clsx';
import type { ComponentProps } from 'react';

export type LabelProps = Omit<ComponentProps<'div'>, 'role'>;

export const Label = ({ className, ...props }: LabelProps) => (
  <div {...props} className={clsx('str-chat__label', className)} role='label' />
);
