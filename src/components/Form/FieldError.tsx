import clsx from 'clsx';
import type { ComponentProps, ReactNode } from 'react';
import React from 'react';

export type FieldErrorProps = ComponentProps<'div'> & {
  /** Error message (string or custom content e.g. icon + text) */
  text?: ReactNode;
};

export const FieldError = ({ className, text, ...props }: FieldErrorProps) => (
  <div {...props} className={clsx('str-chat__form-field-error', className)}>
    {text}
  </div>
);
