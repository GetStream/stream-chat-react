import { Button, type ButtonProps } from '../Button';
import clsx from 'clsx';
import React from 'react';

export const QuickMessageActionsButton = ({ className, ...props }: ButtonProps) => (
  <Button
    appearance='ghost'
    circular
    className={clsx('str-chat__message-actions-box-button', className)}
    size='sm'
    variant='secondary'
    {...props}
  />
);
