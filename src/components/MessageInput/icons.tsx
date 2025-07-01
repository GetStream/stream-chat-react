import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';

import { useTranslationContext } from '../../context/TranslationContext';

export const LoadingIndicatorIcon = ({ size = 20 }: { size?: number }) => {
  const id = useMemo(() => nanoid(), []);

  return (
    <div className='str-chat__loading-indicator'>
      <svg
        data-testid='loading-indicator'
        height={size}
        viewBox='0 0 30 30'
        width={size}
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

export const CloseIcon = () => (
  <svg
    data-testid='close-no-outline'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z'
      fill='black'
    ></path>
  </svg>
);

export const RetryIcon = () => (
  <svg
    data-testid='retry'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M17.6449 6.35C16.1949 4.9 14.2049 4 11.9949 4C7.57488 4 4.00488 7.58 4.00488 12C4.00488 16.42 7.57488 20 11.9949 20C15.7249 20 18.8349 17.45 19.7249 14H17.6449C16.8249 16.33 14.6049 18 11.9949 18C8.68488 18 5.99488 15.31 5.99488 12C5.99488 8.69 8.68488 6 11.9949 6C13.6549 6 15.1349 6.69 16.2149 7.78L12.9949 11H19.9949V4L17.6449 6.35Z'
      fill='black'
    />
  </svg>
);

export const DownloadIcon = () => (
  <svg
    data-testid='download'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      d='M19.35 10.04C18.67 6.59 15.64 4 12 4C9.11 4 6.6 5.64 5.35 8.04C2.34 8.36 0 10.91 0 14C0 17.31 2.69 20 6 20H19C21.76 20 24 17.76 24 15C24 12.36 21.95 10.22 19.35 10.04ZM19 18H6C3.79 18 2 16.21 2 14C2 11.95 3.53 10.24 5.56 10.03L6.63 9.92L7.13 8.97C8.08 7.14 9.94 6 12 6C14.62 6 16.88 7.86 17.39 10.43L17.69 11.93L19.22 12.04C20.78 12.14 22 13.45 22 15C22 16.65 20.65 18 19 18ZM13.45 10H10.55V13H8L12 17L16 13H13.45V10Z'
      fill='black'
    ></path>
  </svg>
);

export const LinkIcon = () => (
  <svg
    fill='none'
    height='11'
    viewBox='0 0 20 11'
    width='20'
    xmlns='http://www.w3.org/2000/svg'
  >
    <path
      clipRule='evenodd'
      d='M1.9 5.5C1.9 3.79 3.29 2.4 5 2.4H8.05C8.57467 2.4 9 1.97467 9 1.45C9 0.925329 8.57467 0.5 8.05 0.5H5C2.24 0.5 0 2.74 0 5.5C0 8.26 2.24 10.5 5 10.5H8.05C8.57467 10.5 9 10.0747 9 9.55C9 9.02533 8.57467 8.6 8.05 8.6H5C3.29 8.6 1.9 7.21 1.9 5.5ZM6 5.5C6 6.05228 6.44772 6.5 7 6.5H13C13.5523 6.5 14 6.05228 14 5.5C14 4.94772 13.5523 4.5 13 4.5H7C6.44772 4.5 6 4.94772 6 5.5ZM15 0.5H11.95C11.4253 0.5 11 0.925329 11 1.45C11 1.97467 11.4253 2.4 11.95 2.4H15C16.71 2.4 18.1 3.79 18.1 5.5C18.1 7.21 16.71 8.6 15 8.6H11.95C11.4253 8.6 11 9.02533 11 9.55C11 10.0747 11.4253 10.5 11.95 10.5H15C17.76 10.5 20 8.26 20 5.5C20 2.74 17.76 0.5 15 0.5Z'
      fill='#005DFF'
      fillRule='evenodd'
    />
  </svg>
);

export const SendIcon = () => {
  const { t } = useTranslationContext('SendButton');
  return (
    <svg
      data-testid='send'
      fill='currentColor'
      height='24'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{t('Send')}</title>
      <path d='M4.00952 22L24 12L4.00952 2L4 9.77778L18.2857 12L4 14.2222L4.00952 22Z'></path>
    </svg>
  );
};

export const MicIcon = () => (
  <svg fill='currentColor' viewBox='0 0 14 20' xmlns='http://www.w3.org/2000/svg'>
    <path d='M7 12.5C8.66 12.5 10 11.16 10 9.5V3.5C10 1.84 8.66 0.5 7 0.5C5.34 0.5 4 1.84 4 3.5V9.5C4 11.16 5.34 12.5 7 12.5Z' />
    <path d='M12 9.5C12 12.26 9.76 14.5 7 14.5C4.24 14.5 2 12.26 2 9.5H0C0 13.03 2.61 15.93 6 16.42V19.5H8V16.42C11.39 15.93 14 13.03 14 9.5H12Z' />
  </svg>
);

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
