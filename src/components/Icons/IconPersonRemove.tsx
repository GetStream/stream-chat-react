import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';
import type { ComponentProps } from 'react';

export const IconPersonRemove = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--person-remove', className)}
    viewBox='0 0 16 16'
  >
    <path d='M13.3333 10.6668L12 12.0002M12 12.0002L10.6667 13.3335M12 12.0002L10.6667 10.6668M12 12.0002L13.3333 13.3335M7.9024 8.83436C5.69028 8.8727 4.01455 10.204 3.32244 12.0754C3.0499 12.8123 3.67909 13.5002 4.46476 13.5002H8.16746M7.9024 8.83436C7.93506 8.83376 7.96786 8.8335 8.0008 8.8335C8.34753 8.8335 8.6814 8.8651 9.0008 8.92543M7.9024 8.83436C7.469 8.8419 7.0564 8.89903 6.66753 9.00016M10.5 4.3335C10.5 5.71421 9.38073 6.8335 8 6.8335C6.61928 6.8335 5.5 5.71421 5.5 4.3335C5.5 2.95278 6.61928 1.8335 8 1.8335C9.38073 1.8335 10.5 2.95278 10.5 4.3335Z' />
  </BaseIcon>
);
