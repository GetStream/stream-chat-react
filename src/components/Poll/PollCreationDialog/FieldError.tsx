import clsx from 'clsx';
import React from 'react';
import ReactMarkdown from 'react-markdown';
import className = ReactMarkdown.propTypes.className;

type FieldErrorProps = {
  className?: string;
  text?: string;
};
export const FieldError = ({ text }: FieldErrorProps) => (
  <div className={clsx('str-chat__form-field-error', className)}>{text}</div>
);
