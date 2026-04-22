import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import { BaseIcon, type BaseIconProps } from './BaseIcon';

function toIconClass(name: string) {
  return (
    'str-chat__icon--' +
    name
      .replace(/^Icon/, '')
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/([A-Za-z])(\d)/g, '$1-$2')
      .replace(/(\d)([A-Za-z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase()
  );
}

type IconProps = BaseIconProps & Record<`data-${string}`, string>;

export function createIcon(name: string, content: ReactNode, defaultProps?: IconProps) {
  const iconClass = toIconClass(name);
  const Icon = ({ className, ...props }: BaseIconProps) => (
    <BaseIcon {...defaultProps} {...props} className={clsx(iconClass, className)}>
      {content}
    </BaseIcon>
  );
  Icon.displayName = name;
  return Icon;
}
