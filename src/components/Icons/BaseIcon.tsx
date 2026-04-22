import React, { type ComponentProps } from 'react';
import clsx from 'clsx';

export type BaseIconProps = ComponentProps<'svg'> & {
  decorative?: boolean;
};

export const BaseIcon = ({ className, decorative = true, ...props }: BaseIconProps) => {
  const ariaHidden = props['aria-hidden'] ?? (decorative ? true : undefined);
  const focusable = props.focusable ?? (decorative ? false : undefined);

  return (
    <svg
      viewBox='0 0 20 20'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
      aria-hidden={ariaHidden}
      className={clsx('str-chat__icon', className)}
      focusable={focusable}
    />
  );
};
