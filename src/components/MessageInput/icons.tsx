import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';

import { useTranslationContext } from '../../context/TranslationContext';

export const LoadingIndicatorIcon = () => {
  const id = useMemo(() => nanoid(), []);

  return (
    <div className='str-chat__loading-indicator'>
      <svg
        data-testid='loading-indicator'
        viewBox='0 0 30 30'
        xmlns='http://www.w3.org/2000/svg'
      >
        <defs>
          <linearGradient
            id={`${id}-linear-gradient`}
            x1='50%'
            x2='50%'
            y1='0%'
            y2='100%'
          >
            <stop offset='0%' stopColor='#FFF' stopOpacity='0' />
            <stop data-testid='stop-color' offset='100%' stopOpacity='1' />
          </linearGradient>
        </defs>
        <path
          d='M2.518 23.321l1.664-1.11A12.988 12.988 0 0 0 15 28c7.18 0 13-5.82 13-13S22.18 2 15 2V0c8.284 0 15 6.716 15 15 0 8.284-6.716 15-15 15-5.206 0-9.792-2.652-12.482-6.679z'
          fill={`url(#${id}-linear-gradient)`}
          fillRule='evenodd'
        />
      </svg>
    </div>
  );
};

export const UploadIcon = () => {
  const { t } = useTranslationContext('UploadIcon');
  return (
    <svg
      data-testid='attach-icon'
      fill='none'
      height='24'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{t('Attach files')}</title>
      <g clipPath='url(#clip0_10878_5)'>
        <path
          d='M12.9997 6.99993L10.9997 6.99993L10.9997 10.9999L6.99972 10.9999L6.99972 12.9999L10.9997 12.9999L10.9997 16.9999L12.9997 16.9999L12.9997 12.9999L16.9997 12.9999L16.9997 10.9999L12.9997 10.9999L12.9997 6.99993ZM11.9997 1.99992C6.47972 1.99992 1.99972 6.47993 1.99972 11.9999C1.99972 17.5199 6.47972 21.9999 11.9997 21.9999C17.5197 21.9999 21.9997 17.5199 21.9997 11.9999C21.9997 6.47993 17.5197 1.99992 11.9997 1.99992ZM11.9997 19.9999C7.58972 19.9999 3.99972 16.4099 3.99972 11.9999C3.99972 7.58993 7.58972 3.99993 11.9997 3.99993C16.4097 3.99993 19.9997 7.58993 19.9997 11.9999C19.9997 16.4099 16.4097 19.9999 11.9997 19.9999Z'
          fill='black'
        />
      </g>
      <defs>
        <clipPath id='clip0_10878_5'>
          <rect fill='white' height='24' width='24' />
        </clipPath>
      </defs>
    </svg>
  );
};

export const BinIcon = () => (
  <svg fill='currentColor' viewBox='0 0 32 32' xmlns='http://www.w3.org/2000/svg'>
    <path d='M8.00033 25.3333C8.00033 26.8 9.20033 28 10.667 28H21.3337C22.8003 28 24.0003 26.8 24.0003 25.3333V12C24.0003 10.5333 22.8003 9.33333 21.3337 9.33333H10.667C9.20033 9.33333 8.00033 10.5333 8.00033 12V25.3333ZM24.0003 5.33333H20.667L19.7203 4.38667C19.4803 4.14667 19.1337 4 18.787 4H13.2137C12.867 4 12.5203 4.14667 12.2803 4.38667L11.3337 5.33333H8.00033C7.26699 5.33333 6.66699 5.93333 6.66699 6.66667C6.66699 7.4 7.26699 8 8.00033 8H24.0003C24.7337 8 25.3337 7.4 25.3337 6.66667C25.3337 5.93333 24.7337 5.33333 24.0003 5.33333Z' />
  </svg>
);

export const PauseIcon = () => (
  <svg
    data-testid='str-chat__pause-icon'
    fill='currentColor'
    viewBox='0 0 16 20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M0 19.3333H5.33333V0.666626H0V19.3333ZM10.6667 0.666626V19.3333H16V0.666626H10.6667Z' />
  </svg>
);

export const PlayIcon = () => (
  <svg
    data-testid='str-chat__play-icon'
    fill='currentColor'
    viewBox='0 0 14 18'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path d='M0.236328 2.09338V15.9067C0.236328 16.9601 1.39633 17.6001 2.28966 17.0267L13.143 10.1201C13.9697 9.60005 13.9697 8.40005 13.143 7.86672L2.28966 0.973385C1.39633 0.400051 0.236328 1.04005 0.236328 2.09338Z' />
  </svg>
);

export const CheckSignIcon = () => (
  <svg fill='currentColor' viewBox='0 0 18 14' xmlns='http://www.w3.org/2000/svg'>
    <path d='M5.79457 10.875L2.32457 7.40502C1.93457 7.01502 1.30457 7.01502 0.91457 7.40502C0.52457 7.79502 0.52457 8.42502 0.91457 8.81502L5.09457 12.995C5.48457 13.385 6.11457 13.385 6.50457 12.995L17.0846 2.41502C17.4746 2.02502 17.4746 1.39502 17.0846 1.00502C16.6946 0.615024 16.0646 0.615024 15.6746 1.00502L5.79457 10.875Z' />
  </svg>
);
