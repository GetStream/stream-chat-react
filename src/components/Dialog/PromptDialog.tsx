import type { ComponentProps } from 'react';
import React from 'react';
import clsx from 'clsx';

export type ConfirmationDialogProps = {
  actions: ComponentProps<'button'>[];
  prompt: string;
  className?: string;
  title?: string;
};

export const PromptDialog = ({
  actions,
  className,
  prompt,
  title,
}: ConfirmationDialogProps) => (
  <div className={clsx('str-chat__dialog str-chat__dialog--prompt', className)}>
    <div className='str-chat__dialog__body'>
      {title && <div className='str-chat__dialog__title'>{title}</div>}
      <div className='str-chat__dialog__prompt'>{prompt}</div>
    </div>
    <div className='str-chat__dialog__controls'>
      {actions.map(({ className, ...props }, i) => (
        <button
          className={clsx(`str-chat__dialog__controls-button`, className)}
          key={`prompt-dialog__controls-button--${i}`}
          {...props}
        />
      ))}
    </div>
  </div>
);
