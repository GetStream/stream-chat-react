import clsx from 'clsx';
import type {
  ChangeEventHandler,
  ComponentProps,
  KeyboardEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import React, { isValidElement, useRef, useState } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';

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
  const {
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    checked,
    defaultChecked,
    disabled,
    id,
    onChange,
    onKeyDown,
    ...rest
  } = props;
  const generatedSwitchId = useStableId();
  const switchId = id ?? `str-chat__switch-field-${generatedSwitchId}`;
  const switchLabelId = `${switchId}-label`;
  const inputRef = useRef<HTMLInputElement | null>(null);

  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolledChecked;
  const isReadOnly = isControlled && onChange === undefined;

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!isControlled) {
      setUncontrolledChecked(event.target.checked);
    }

    onChange?.(event);
  };

  const handleKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.key !== ' ') return;

    event.preventDefault();
    event.currentTarget.click();
  };

  const handleSwitchClick: MouseEventHandler<HTMLDivElement> = (event) => {
    if (disabled || event.target === inputRef.current) return;
    inputRef.current?.click();
  };

  // When no title/aria-label is provided, SwitchField can still be named by a caller-supplied
  // child element id via aria-labelledby.
  const childElement = isValidElement<{ id?: string }>(children) ? children : undefined;
  const childLabelId = childElement?.props.id;
  // Accessible-name precedence:
  // 1) explicit aria-labelledby prop
  // 2) explicit aria-label prop
  // 3) generated title label id (title path)
  // 4) caller-supplied child id (children path)
  const resolvedAriaLabelledBy =
    ariaLabelledBy ?? (!ariaLabel ? (title ? switchLabelId : childLabelId) : undefined);

  return (
    <div
      className={clsx(
        'str-chat__form__switch-field',
        fieldClassName,
        disabled && 'str-chat__form__switch-field--disabled',
      )}
    >
      {title ? (
        <SwitchFieldLabel
          description={description}
          htmlFor={switchId}
          id={switchLabelId}
          title={title}
        />
      ) : (
        children
      )}
      <Switch
        {...rest}
        aria-label={ariaLabel}
        aria-labelledby={resolvedAriaLabelledBy}
        checked={isOn}
        disabled={disabled}
        id={switchId}
        on={isOn}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onSwitchClick={handleSwitchClick}
        readOnly={isReadOnly}
        switchRef={inputRef}
      />
    </div>
  );
};
export type SwitchProps = Omit<ComponentProps<'input'>, 'type'> & {
  on?: boolean;
  onSwitchClick?: MouseEventHandler<HTMLDivElement>;
  /**
   * Renders the switch as a visual-only indicator when another element owns interaction.
   * Example: a button row with a trailing switch indicator must not render an input inside the button.
   */
  presentation?: boolean;
  switchRef?: React.RefObject<HTMLInputElement | null>;
};

export const Switch = ({
  className,
  on,
  onSwitchClick,
  presentation,
  switchRef,
  ...props
}: SwitchProps) => (
  <div
    aria-hidden={presentation ? true : undefined}
    className={clsx('str-chat__form__switch-field__switch', {
      'str-chat__form__switch-field__switch--on': on,
    })}
    onClick={presentation ? undefined : onSwitchClick}
  >
    {!presentation && (
      <input
        {...props}
        className={clsx('str-chat__form__switch-field__input', className)}
        ref={switchRef}
        role='switch'
        type='checkbox'
      />
    )}
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
