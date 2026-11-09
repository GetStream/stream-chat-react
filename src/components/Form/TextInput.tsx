import clsx from 'clsx';
import React, { forwardRef } from 'react';
import type { ComponentProps, ReactNode } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';
import { useComponentContextIcons } from '../../context';

export type TextInputVariant = 'outline' | 'ghost';

/** Where the field message sits relative to the bordered control. */
export type TextInputFieldMessagePlacement = 'outside' | 'inside';

export type TextInputProps = Omit<ComponentProps<'input'>, 'className'> & {
  /** Root class name. */
  className?: string;
  /**
   * `outside` shows the message below the bordered wrapper, `inside` under the value row within
   * the border. Defaults to `outside`.
   */
  fieldMessagePlacement?: TextInputFieldMessagePlacement;
  /** Label above the input. */
  label?: string;
  /** Content before the input, e.g. an icon. */
  leading?: ReactNode;
  /** Content after the input, e.g. a clear button. */
  trailing?: ReactNode;
  /** Suffix text after the input value, inside the field. */
  trailingText?: string;
  /** Neutral helper message below the input, without an icon. */
  message?: ReactNode;
  /** Error message, shown when `error` is true. Falls back to `message`. */
  errorMessage?: ReactNode;
  /** Icon before the error text. Defaults to the exclamation mark icon. */
  errorMessageIcon?: ReactNode;
  /** Success message below the input. Hidden while an error shows. */
  successMessage?: ReactNode;
  /** Icon before the success text. Defaults to the checkmark icon. */
  successMessageIcon?: ReactNode;
  /** Marks the input invalid and applies the error border and styling. */
  error?: boolean;
  /** `outline` always shows the border, `ghost` only on focus. Defaults to `outline`. */
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

/** At most one of the error, success and neutral messages shows under the field. */
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
  const { IconCheckmark, IconExclamationMark } = useComponentContextIcons();
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
  const describedBy = [inputProps['aria-describedby'], messageId]
    .filter((value): value is string => !!value)
    .join(' ');

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
            <span className='str-chat__form-text-input__leading'>{leading}</span>
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
            <span className='str-chat__form-text-input__trailing'>{trailing}</span>
          ) : null}
        </div>
        {messageInside ? fieldMessage : null}
      </div>
      {messageInside ? null : fieldMessage}
    </div>
  );
});
