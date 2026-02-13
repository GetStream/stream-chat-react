import clsx from 'clsx';
import React, { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';

export type TextInputVariant = 'outline' | 'ghost';

export type TextInputProps = Omit<ComponentProps<'input'>, 'className'> & {
  /** Optional label above the input */
  label?: string;
  /** Optional leading content (e.g. icon) inside the input area */
  leading?: ReactNode;
  /** Optional trailing content (e.g. clear button) inside the input area */
  trailing?: ReactNode;
  /** Optional suffix text shown after the input value, inside the field */
  trailingText?: string;
  /** Helper or error message below the input (string, icon, or other React content) */
  message?: ReactNode;
  /** When true, shows error border and error styling for message */
  error?: boolean;
  /** Visual variant: outline = border always visible, ghost = border only on focus */
  variant?: TextInputVariant;
  /** Optional class name for the root wrapper */
  className?: string;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    className,
    disabled,
    error = false,
    id: idProp,
    label,
    leading,
    message,
    trailing,
    trailingText,
    variant = 'outline',
    ...inputProps
  },
  ref,
) {
  const generatedId = useStableId();
  const id = idProp ?? generatedId;
  const messageId = message ? `${id}-message` : undefined;

  return (
    <div
      className={clsx(
        'str-chat__form-text-input',
        error && 'str-chat__form-text-input--error',
        disabled && 'str-chat__form-text-input--disabled',
        className,
      )}
    >
      {!!label && (
        <label className='str-chat__form-text-input__label' htmlFor={id}>
          {label}
        </label>
      )}
      <div
        className={clsx(
          'str-chat__form-text-input__wrapper',
          `str-chat__form-text-input__wrapper--${variant}`,
        )}
      >
        {!!leading && (
          <span aria-hidden className='str-chat__form-text-input__leading'>
            {leading}
          </span>
        )}
        <input
          aria-describedby={messageId}
          aria-invalid={error}
          className='str-chat__form-text-input__input'
          disabled={disabled}
          id={id}
          ref={ref}
          {...inputProps}
        />
        {trailingText != null && (
          <span aria-hidden className='str-chat__form-text-input__suffix'>
            {trailingText}
          </span>
        )}
        {!!trailing && (
          <span aria-hidden className='str-chat__form-text-input__trailing'>
            {trailing}
          </span>
        )}
      </div>
      {!!message && (
        <div
          className='str-chat__form-text-input__message'
          id={messageId}
          role={error ? 'alert' : undefined}
        >
          {message}
        </div>
      )}
    </div>
  );
});
