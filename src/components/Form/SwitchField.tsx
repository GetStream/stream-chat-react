import clsx from 'clsx';
import React, {
  ComponentProps,
  ElementRef,
  KeyboardEventHandler,
  PropsWithChildren,
  useRef,
} from 'react';

export type SwitchFieldProps = PropsWithChildren<ComponentProps<'input'>>;

export const SwitchField = ({ children, ...props }: SwitchFieldProps) => {
  const inputRef = useRef<ElementRef<'input'>>(null);
  const handleKeyUp: KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (![' ', 'Enter'].includes(event.key) || !inputRef.current) return;
    event.preventDefault();
    inputRef.current.click();
  };

  return (
    <div className='str-chat__form__field str-chat__form__switch-field'>
      <label>
        <div className='str-chat__form__field str-chat__form__switch-field-content'>{children}</div>
        <input type='checkbox' {...props} ref={inputRef} />
        <div
          className={clsx('str-chat__form__switch-field__switch', {
            'str-chat__form__switch-field__switch--on': props.checked,
          })}
          onKeyUp={handleKeyUp}
          tabIndex={0}
        >
          <div className='str-chat__form__switch-field__switch-handle' />
        </div>
      </label>
    </div>
  );
};

export type SimpleSwitchFieldProps = ComponentProps<'input'> & {
  labelText: string;
};

export const SimpleSwitchField = ({ labelText, ...props }: SimpleSwitchFieldProps) => (
  <SwitchField {...props}>
    <div className='str-chat__form__field str-chat__form__switch-field__text'>{labelText}</div>
  </SwitchField>
);
