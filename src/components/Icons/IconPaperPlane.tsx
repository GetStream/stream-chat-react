import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconPaperPlane = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--paper-plane', className)}
    viewBox='0 0 20 20'
  >
    <path
      d='M5.00006 9.99996H7.70839M5.00006 9.99996L2.81084 4.05778C2.54981 3.34929 3.29014 2.68668 3.96546 3.02433L16.426 9.25463C17.0402 9.56171 17.0402 10.4382 16.426 10.7453L3.96546 16.9756C3.29014 17.3133 2.54981 16.6506 2.81084 15.9421L5.00006 9.99996Z'
      stroke='white'
    />
  </BaseIcon>
);
