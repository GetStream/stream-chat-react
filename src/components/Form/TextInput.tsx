import clsx from 'clsx';
import React, { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';
import { IconCheckmark2, IconExclamationCircle } from '../Icons';

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
  /** Neutral/helper message below the input (no icon) */
  message?: ReactNode;
  /** Error message below the input; shown when error is true, with errorMessageIcon */
  errorMessage?: ReactNode;
  /** Icon shown before error message (default: IconExclamationCircle) */
  errorMessageIcon?: ReactNode;
  /** Success message below the input; shown when provided, with successMessageIcon */
  successMessage?: ReactNode;
  /** Icon shown before success message (default: IconCheckmark2) */
  successMessageIcon?: ReactNode;
  /** When true, shows error border and error message styling */
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
    errorMessage,
    errorMessageIcon,
    id: idProp,
    label,
    leading,
    message,
    successMessage,
    successMessageIcon,
    trailing,
    trailingText,
    variant = 'outline',
    ...inputProps
  },
  ref,
) {
  const generatedId = useStableId();
  const id = idProp ?? generatedId;

  const displayError = error && (errorMessage != null || message != null);
  const displaySuccess = successMessage != null;
  const displayNeutralMessage = message != null && !error;
  const displayMessage = displayError || displaySuccess || displayNeutralMessage;

  const messageId = displayMessage ? `${id}-message` : undefined;

  const messageContent = displayError
    ? ((
        <>
          <span aria-hidden className='str-chat__form-text-input__message-icon'>
            {errorMessageIcon ?? <IconExclamationCircle />}
          </span>
          {errorMessage ?? message}
        </>
      ) as ReactNode)
    : displaySuccess
      ? ((
          <>
            <span aria-hidden className='str-chat__form-text-input__message-icon'>
              {successMessageIcon ?? <IconCheckmark2 />}
            </span>
            {successMessage}
          </>
        ) as ReactNode)
      : displayNeutralMessage
        ? (message as ReactNode)
        : null;

  return (
    <div
      className={clsx(
        'str-chat__form-text-input',
        error && 'str-chat__form-text-input--error',
        displaySuccess && 'str-chat__form-text-input--success',
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
      {messageContent != null && (
        <div
          className={clsx(
            'str-chat__form-text-input__message',
            displayError && 'str-chat__form-field-error',
            displaySuccess && 'str-chat__form-text-input__message--success',
          )}
          id={messageId}
          role={error ? 'alert' : undefined}
        >
          {messageContent}
        </div>
      )}
    </div>
  );
});
