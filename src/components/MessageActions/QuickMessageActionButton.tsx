import { Button, type ButtonProps } from '../Button';
import clsx from 'clsx';
import React, { forwardRef } from 'react';

export const QuickMessageActionsButton = forwardRef<HTMLButtonElement, ButtonProps>(
  function QuickMessageActionsButton({ className, ...props }, ref) {
    return (
      <Button
        appearance='ghost'
        circular
        className={clsx('str-chat__message-actions-box-button', className)}
        ref={ref}
        size='sm'
        variant='secondary'
        {...props}
      />
    );
  },
);
