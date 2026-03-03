import type { ComponentProps } from 'react';
import { BaseIcon } from './BaseIcon';
import clsx from 'clsx';

export const IconGiphy = ({ className, ...props }: ComponentProps<'svg'>) => (
  <BaseIcon
    {...props}
    className={clsx('str-chat__icon--giphy', className)}
    viewBox='0 0 16 16'
  >
    <g clipPath='url(#clip0_4197_15218)'>
      <path
        clipRule='evenodd'
        d='M3.33674 1.82861H12.6639V14.171H3.33594L3.33674 1.82861Z'
        fill='black'
        fillRule='evenodd'
      />
      <path d='M1.47217 1.37109H3.33697V14.6287H1.47217V1.37109Z' fill='#04FF8E' />
      <path d='M12.6631 5.02881H14.5279V14.6288H12.6631V5.02881Z' fill='#8E2EFF' />
      <path d='M1.47217 14.1714H14.5282V16.0002H1.47217V14.1714Z' fill='#00C5FF' />
      <path d='M1.47217 0H8.93297V1.8288H1.47217V0Z' fill='#FFF152' />
      <path
        d='M12.663 3.6568V1.8288H10.7974V0H8.93262V5.4856H14.5278V3.6568'
        fill='#FF5B5B'
      />
      <path d='M12.6631 7.31464V5.48584H14.5279' fill='#551C99' />
      <path
        clipRule='evenodd'
        d='M8.93298 0V1.8288H7.06738'
        fill='#999131'
        fillRule='evenodd'
      />
    </g>
    <defs>
      <clipPath id='clip0_4197_15218'>
        <rect fill='white' height='16' width='16' />
      </clipPath>
    </defs>
  </BaseIcon>
);
