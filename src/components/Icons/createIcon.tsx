import { type ComponentProps, type ReactNode } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

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

export function createIcon(name: string, content: ReactNode) {
  const iconClass = toIconClass(name);
  const Icon = ({ className, ...props }: ComponentProps<'svg'>) => (
    <BaseIcon {...props} className={clsx(iconClass, className)}>
      {content}
    </BaseIcon>
  );
  Icon.displayName = name;
  return Icon;
}
