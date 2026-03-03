import clsx from 'clsx';
import type {
  ComponentProps,
  KeyboardEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import React, { useRef } from 'react';

export type SwitchFieldProps = Omit<
  PropsWithChildren<ComponentProps<'input'>>,
  'children'
> & {
  /** Main label content when title/description are not used */
  children?: ReactNode;
  /** Optional description line below title */
  description?: string;
  /** Class applied to the root div element of the SwitchField component */
  fieldClassName?: string;
  /** Optional title line */
  title?: string;
};

export const SwitchField = ({
  children,
  description,
  fieldClassName,
  title,
  ...props
}: SwitchFieldProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  const handleSwitchKeyDown: KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (![' ', 'Enter'].includes(e.key) || !inputRef.current) return;
    e.preventDefault();
    inputRef.current.click();
  };

  const id = props.id;

  return (
    <div
      className={clsx(
        'str-chat__form__switch-field',
        fieldClassName,
        props.disabled && 'str-chat__form__switch-field--disabled',
      )}
    >
      <input
        aria-hidden
        className='str-chat__form__switch-field__input'
        id={id}
        type='checkbox'
        {...props}
        ref={inputRef}
      />
      {title ? (
        <SwitchFieldLabel
          description={description}
          htmlFor={id}
          title={title}
        ></SwitchFieldLabel>
      ) : (
        children
      )}
      <Switch
        on={props.checked}
        onClick={() => inputRef.current?.click()}
        onKeyDown={handleSwitchKeyDown}
      />
    </div>
  );
};

export type SwitchProps = ComponentProps<'div'> & {
  on?: boolean;
};

const Switch = ({ on, ...props }: SwitchProps) => (
  <div
    {...props}
    aria-checked={on}
    className={clsx('str-chat__form__switch-field__switch', {
      'str-chat__form__switch-field__switch--on': on,
    })}
    role='button'
    tabIndex={0}
  >
    <span className='str-chat__form__switch-field__switch-handle' />
  </div>
);

export type SwitchFieldLabelProps = ComponentProps<'label'> & {
  /** Adds className str-chat__form__switch-field__label--as-error to the root */
  asError?: boolean;
  title?: string;
  description?: string;
};

export const SwitchFieldLabel = ({
  asError,
  children,
  className,
  description,
  title,
  ...props
}: SwitchFieldLabelProps) => (
  <label
    className={clsx(
      'str-chat__form__switch-field__label',
      { 'str-chat__form__switch-field__label--as-error': asError },
      className,
    )}
    {...props}
  >
    <div className='str-chat__form__switch-field__label__content'>
      {title ? (
        <>
          <SwitchFieldTitle>{title}</SwitchFieldTitle>
          {description != null && description !== '' && (
            <SwitchFieldDescription>{description}</SwitchFieldDescription>
          )}
        </>
      ) : (
        children
      )}
    </div>
  </label>
);

export type SwitchFieldTitleProps = ComponentProps<'div'> & {
  title?: string;
};

export const SwitchFieldTitle = ({
  children,
  className,
  title,
  ...props
}: SwitchFieldTitleProps) => (
  <div
    className={clsx('str-chat__form__switch-field__label__text', className)}
    {...props}
  >
    {children ?? title}
  </div>
);

export type SwitchFieldDescriptionProps = ComponentProps<'div'> & {
  description?: string;
};

export const SwitchFieldDescription = ({
  children,
  className,
  description,
  ...props
}: SwitchFieldDescriptionProps) => (
  <div
    className={clsx('str-chat__form__switch-field__label__description', className)}
    {...props}
  >
    {children ?? description}
  </div>
);
