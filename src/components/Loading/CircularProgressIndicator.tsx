import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

const RING_RADIUS = 12;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export type CircularProgressIndicatorProps = {
  /** Clamped 0–100 completion. */
  percent: number;
};

/** Circular progress indicator with input from 0 to 100. */
export const CircularProgressIndicator = ({
  percent,
}: CircularProgressIndicatorProps) => {
  const { t } = useTranslationContext('CircularProgressIndicator');
  const dashOffset = RING_CIRCUMFERENCE * (1 - percent / 100);

  return (
    <div className='str-chat__circular-progress-indicator'>
      <svg
        aria-label={t('aria/Percent complete', { percent })}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={percent}
        data-testid='circular-progress-ring'
        height='100%'
        role='progressbar'
        viewBox='0 0 32 32'
        width='100%'
        xmlns='http://www.w3.org/2000/svg'
      >
        <circle
          cx='16'
          cy='16'
          fill='none'
          r={RING_RADIUS}
          stroke='currentColor'
          strokeOpacity={0.35}
          strokeWidth='2.5'
        />
        <circle
          cx='16'
          cy='16'
          fill='none'
          r={RING_RADIUS}
          stroke='currentColor'
          strokeDasharray={RING_CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          strokeLinecap='round'
          strokeWidth='2.5'
          transform='rotate(-90 16 16)'
        />
      </svg>
    </div>
  );
};
