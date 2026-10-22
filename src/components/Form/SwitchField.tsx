import clsx from 'clsx';
import type {
  ChangeEventHandler,
  ComponentProps,
  KeyboardEventHandler,
  MouseEventHandler,
  PropsWithChildren,
  ReactNode,
} from 'react';
import React, { isValidElement, useContext, useRef, useState } from 'react';
import { useStableId } from '../UtilityComponents/useStableId';
import { AriaLiveAnnouncerContext } from '../Accessibility';
import { useTranslationContext } from '../../context';

export type SwitchFieldProps = Omit<
  PropsWithChildren<ComponentProps<'input'>>,
  'children'
> & {
  /** Label content, ignored when `title` is set. */
  children?: ReactNode;
  /** Description line below the title. Rendered only with `title`. */
  description?: string;
  /** Class applied to the root element. */
  fieldClassName?: string;
  /** Title line. Replaces `children` as the label. */
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
  // Optional: a SwitchField can render outside an announcer provider, where it stays silent.
  const announce = useContext(AriaLiveAnnouncerContext)?.announce;
  const { t } = useTranslationContext();

  const [uncontrolledChecked, setUncontrolledChecked] = useState(Boolean(defaultChecked));
  const isControlled = checked !== undefined;
  const isOn = isControlled ? checked : uncontrolledChecked;
  const isReadOnly = isControlled && onChange === undefined;

  // Without a title or `aria-label`, the ID of a caller-supplied child element can name the switch.
  const childElement = isValidElement<{ id?: string }>(children) ? children : undefined;
  const childLabelId = childElement?.props.id;
  // Accessible name precedence: `aria-labelledby`, `aria-label`, the generated title label ID,
  // then the child element ID.
  const resolvedAriaLabelledBy =
    ariaLabelledBy ?? (!ariaLabel ? (title ? switchLabelId : childLabelId) : undefined);

  // The announcement names the setting by `title`, then `aria-label`, then the text of the
  // `aria-labelledby` target (its title row when present, so the description is not read as name).
  const resolveAnnouncementName = () => {
    if (title) return title;
    if (ariaLabel) return ariaLabel;
    if (resolvedAriaLabelledBy) {
      const labelEl = document.getElementById(resolvedAriaLabelledBy);
      const titleEl = labelEl?.querySelector(
        '.str-chat__form__switch-field__label__text',
      );
      return (titleEl?.textContent || labelEl?.textContent || '').trim() || undefined;
    }
    return undefined;
  };

  const handleChange: ChangeEventHandler<HTMLInputElement> = (event) => {
    if (!isControlled) {
      setUncontrolledChecked(event.target.checked);
    }

    onChange?.(event);

    const setting = resolveAnnouncementName();
    if (!announce || !setting) return;
    announce(
      event.target.checked
        ? t('form.switchField.enabled.ariaLabel', '{{ setting }} enabled', { setting })
        : t('form.switchField.disabled.ariaLabel', '{{ setting }} disabled', { setting }),
      { priority: 'polite' },
    );
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
   * Renders only the visual switch, without an input, for when another element owns interaction
   * (e.g. a button row, which cannot contain an input).
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
  /** Adds the `str-chat__form__switch-field__label--as-error` class to the root. */
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
