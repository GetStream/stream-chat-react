import clsx from 'clsx';
import type { HTMLAttributes } from 'react';

export type CheckboxProps = HTMLAttributes<HTMLElement> & { checked?: boolean };

export const Checkbox = ({ checked, ...props }: CheckboxProps) => (
  <div
    {...props}
    className={clsx('str-chat__checkmark str-chat__checkbox', {
      'str-chat__checkbox--checked': checked,
      'str-chat__checkmark--checked': checked,
    })}
  />
);

// fixme: remove str-chat__checkmark class with next major release v15
export type CheckmarkProps = CheckboxProps;
// fixme: remove str-chat__checkmark class with next major release v15
export const Checkmark = Checkbox;
