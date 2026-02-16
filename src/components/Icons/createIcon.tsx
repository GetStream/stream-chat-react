import { type ComponentProps, type ReactNode } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export function createIcon(name: string, content: ReactNode) {
  const Icon = ({ className, ...props }: ComponentProps<'svg'>) => (
    <BaseIcon
      viewBox='0 0 16 16'
      xmlns='http://www.w3.org/2000/svg'
      {...props}
      className={clsx('str-chat__icon', className)}
    >
      {content}
    </BaseIcon>
  );
  Icon.displayName = name;
  return Icon;
}
