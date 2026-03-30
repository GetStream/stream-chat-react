import React, { type ComponentProps } from 'react';
import clsx from 'clsx';

export const BaseIcon = ({ className, ...props }: ComponentProps<'svg'>) => (
  <svg
    viewBox='0 0 20 20'
    xmlns='http://www.w3.org/2000/svg'
    {...props}
    className={clsx('str-chat__icon', className)}
  />
);
