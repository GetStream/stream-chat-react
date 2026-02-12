import type { ComponentProps } from 'react';
import clsx from 'clsx';
import { BaseIcon } from './BaseIcon';

export const IconSingleCheckmark = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--single-checkmark', className)}
    viewBox='0 0 16 16'
  >
    <path d='M10.3249 4.84832C10.5006 4.56771 10.8702 4.48252 11.151 4.65789C11.432 4.83352 11.5181 5.20404 11.3424 5.48504L7.80045 11.1511C7.70363 11.306 7.54151 11.4086 7.36002 11.4294C7.17843 11.4501 6.99712 11.3867 6.86784 11.2575L4.74284 9.1325C4.50852 8.89818 4.50852 8.51818 4.74284 8.28387C4.97707 8.04999 5.35626 8.04999 5.59049 8.28387L7.18229 9.87566L10.3249 4.84832Z' />
  </BaseIcon>
);
