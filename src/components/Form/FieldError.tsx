import clsx from 'clsx';
import type { ComponentProps } from 'react';
import React from 'react';

type FieldErrorProps = ComponentProps<'div'> & {
  text?: string;
};
export const FieldError = ({ className, text, ...props }: FieldErrorProps) => (
  <div {...props} className={clsx('str-chat__form-field-error', className)}>
    {text}
  </div>
);
