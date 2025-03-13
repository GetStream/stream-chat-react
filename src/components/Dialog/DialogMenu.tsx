import type { ComponentProps } from 'react';
import React from 'react';
import clsx from 'clsx';

export type DialogMenuButtonProps = ComponentProps<'button'>;

export const DialogMenuButton = ({
  children,
  className,
  ...props
}: DialogMenuButtonProps) => (
  <button className={clsx('str-chat__dialog-menu__button', className)} {...props}>
    <div className='str-chat__dialog-menu__button-icon' />
    <div className='str-chat__dialog-menu__button-text'>{children}</div>
  </button>
);
