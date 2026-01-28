import React, { type ComponentProps } from 'react';
import clsx from 'clsx';

export const ContextMenu = ({ className, ...props }: ComponentProps<'div'>) => (
  <div {...props} className={clsx('str-chat__context-menu', className)} />
);
