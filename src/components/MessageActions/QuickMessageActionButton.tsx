import { Button, type ButtonProps } from '../Button';
import clsx from 'clsx';
import React from 'react';

export const QuickMessageActionsButton = ({ className, ...props }: ButtonProps) => (
  <Button
    {...props}
    className={clsx(
      'str-chat__message-actions-box-button',
      'str-chat__button--ghost',
      'str-chat__button--secondary',
      'str-chat__button--circular',
      className,
    )}
  />
);
