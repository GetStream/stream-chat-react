import clsx from 'clsx';
import React from 'react';

type FieldErrorProps = {
  text?: string;
};
export const FieldError = ({ text }: FieldErrorProps) =>
  text ? <div className={clsx('str-chat__form__input-field__error')}>{text}</div> : null;
