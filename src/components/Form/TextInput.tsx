import clsx from 'clsx';
import React, { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';
import { IconCheckmark, IconExclamationMark } from '../Icons';

export type TextInputVariant = 'outline' | 'ghost';

/** Where the active field message (error, success, or neutral) sits relative to the bordered control */
export type TextInputFieldMessagePlacement = 'outside' | 'inside';

export type TextInputProps = Omit<ComponentProps<'input'>, 'className'> & {
  /** Root class name */
  className?: string;
  /**
   * `outside` (default): message below the bordered wrapper.
   * `inside`: message under the value row, inside the border (error, success, or neutral).
   */
  fieldMessagePlacement?: TextInputFieldMessagePlacement;
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
  /** Error message; shown when `error` is true, with `errorMessageIcon` */
  errorMessage?: ReactNode;
  /** Icon before error text (default: exclamation) */
  errorMessageIcon?: ReactNode;
  /** Success message below the input */
  successMessage?: ReactNode;
  /** Icon before success text (default: checkmark) */
  successMessageIcon?: ReactNode;
  /** When true, error border and error styling */
  error?: boolean;
  /** `outline` = border always; `ghost` = border on focus */
  variant?: TextInputVariant;
};

type TextInputIconMessageLineProps = {
  icon: ReactNode;
  text: ReactNode;
};

const TextInputIconMessageLine = ({ icon, text }: TextInputIconMessageLineProps) => (
  <>
    <span aria-hidden className='str-chat__form-text-input__message-icon'>
      {icon}
    </span>
    <span className='str-chat__form-text-input__message-text'>{text}</span>
  </>
);

/** At most one of error / success / neutral is shown under the field */
type TextInputFieldMessageProps =
  | {
      kind: 'error';
      id?: string;
      insidePlacement: boolean;
      errorMessageIcon?: ReactNode;
      text: ReactNode;
    }
  | {
      kind: 'success';
      id?: string;
      insidePlacement: boolean;
      successMessageIcon?: ReactNode;
      text: ReactNode;
    }
  | {
      kind: 'neutral';
      id?: string;
      insidePlacement: boolean;
      text: ReactNode;
    };

const TextInputFieldMessage = (props: TextInputFieldMessageProps) => {
  if (props.kind === 'neutral') {
    return (
      <div
        className={clsx(
          'str-chat__form-text-input__message',
          props.insidePlacement &&
            'str-chat__form-text-input__message--field-message-inside',
        )}
        id={props.id}
      >
        {props.text}
      </div>
    );
  } else if (props.kind === 'success') {
    return (
      <div
        className={clsx(
          'str-chat__form-text-input__message',
          'str-chat__form-text-input__message--success',
          props.insidePlacement &&
            'str-chat__form-text-input__message--field-message-inside',
        )}
        id={props.id}
      >
        <TextInputIconMessageLine
          icon={props.successMessageIcon ?? <IconCheckmark />}
          text={props.text}
        />
      </div>
    );
  } else if (props.kind === 'error') {
    return (
      <div
        className={clsx(
          'str-chat__form-text-input__message',
          'str-chat__form-field-error',
          props.insidePlacement &&
            'str-chat__form-text-input__message--field-message-inside',
        )}
        id={props.id}
        role='alert'
      >
        <TextInputIconMessageLine
          icon={props.errorMessageIcon ?? <IconExclamationMark />}
          text={props.text}
        />
      </div>
    );
  }

  return null;
};

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  {
    className,
    disabled,
    error = false,
    errorMessage,
    errorMessageIcon,
    fieldMessagePlacement = 'outside',
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
  const autoId = useStableId();
  const id = idProp ?? autoId;

  const hasError = error && (errorMessage != null || message != null);
  const showSuccess = !hasError && successMessage != null;
  const showNeutral = !hasError && !showSuccess && message != null;
  const hasFeedback = hasError || showSuccess || showNeutral;
  const messageInside = fieldMessagePlacement === 'inside' && hasFeedback;

  const messageId = hasError
    ? `${id}-field-error`
    : showSuccess || showNeutral
      ? `${id}-message`
      : undefined;
  const describedBy = messageId;

  const fieldMessage = hasError ? (
    <TextInputFieldMessage
      errorMessageIcon={errorMessageIcon}
      id={messageId}
      insidePlacement={messageInside}
      kind='error'
      text={errorMessage ?? message}
    />
  ) : showSuccess ? (
    <TextInputFieldMessage
      id={messageId}
      insidePlacement={messageInside}
      kind='success'
      successMessageIcon={successMessageIcon}
      text={successMessage}
    />
  ) : showNeutral ? (
    <TextInputFieldMessage
      id={messageId}
      insidePlacement={messageInside}
      kind='neutral'
      text={message}
    />
  ) : null;

  return (
    <div
      className={clsx(
        'str-chat__form-text-input',
        error && 'str-chat__form-text-input--error',
        showSuccess && 'str-chat__form-text-input--success',
        disabled && 'str-chat__form-text-input--disabled',
        messageInside && 'str-chat__form-text-input--field-message-inside',
        className,
      )}
    >
      {label ? (
        <label className='str-chat__form-text-input__label' htmlFor={id}>
          {label}
        </label>
      ) : null}
      <div
        className={clsx(
          'str-chat__form-text-input__wrapper',
          `str-chat__form-text-input__wrapper--${variant}`,
          messageInside && 'str-chat__form-text-input__wrapper--field-message-inside',
        )}
      >
        <div className='str-chat__form-text-input__control-row'>
          {leading ? (
            <span aria-hidden className='str-chat__form-text-input__leading'>
              {leading}
            </span>
          ) : null}
          <input
            aria-describedby={describedBy}
            aria-invalid={error}
            className='str-chat__form-text-input__input'
            disabled={disabled}
            id={id}
            ref={ref}
            {...inputProps}
          />
          {trailingText != null ? (
            <span aria-hidden className='str-chat__form-text-input__suffix'>
              {trailingText}
            </span>
          ) : null}
          {trailing ? (
            <span aria-hidden className='str-chat__form-text-input__trailing'>
              {trailing}
            </span>
          ) : null}
        </div>
        {messageInside ? fieldMessage : null}
      </div>
      {messageInside ? null : fieldMessage}
    </div>
  );
});
