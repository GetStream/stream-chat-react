import { BaseIcon } from './BaseIcon';
import type { ComponentProps } from 'react';
import clsx from 'clsx';

export const IconLightning = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--lightning', className)}
    viewBox='0 0 9 12'
  >
    <path
      d='M6.7266 1.16648C7.024 0.279984 5.9007 -0.417073 5.2514 0.291481L0.232311 5.76855C-0.280469 6.32815 0.109321 7.24205 0.877251 7.24205H3.29225C3.37431 7.24205 3.43956 7.3243 3.41215 7.41115L2.32717 10.8489C2.04697 11.7367 3.17246 12.4136 3.8123 11.7034L8.7732 6.1964C9.27885 5.6351 8.8876 4.72846 8.1232 4.72846H5.70825C5.6253 4.72846 5.5598 4.64444 5.5891 4.5571L6.7266 1.16648Z'
      fill='white'
    />
  </BaseIcon>
);
