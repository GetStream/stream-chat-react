import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconPeople = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--people', className)}
    viewBox='0 0 16 16'
  >
    <path d='M10.5 4.33331C10.5 5.71403 9.38073 6.83331 8 6.83331C6.61928 6.83331 5.5 5.71403 5.5 4.33331C5.5 2.9526 6.61928 1.83331 8 1.83331C9.38073 1.83331 10.5 2.9526 10.5 4.33331Z' />
    <path d='M8.00073 8.83331C5.73998 8.83331 4.02474 10.1762 3.3224 12.0752C3.04986 12.8121 3.67962 13.5 4.4653 13.5H11.5362C12.3219 13.5 12.9516 12.8121 12.6791 12.0752C11.9767 10.1762 10.2615 8.83331 8.00073 8.83331Z' />
  </BaseIcon>
);
