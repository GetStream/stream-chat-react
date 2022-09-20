import React, { useMemo } from 'react';
import { nanoid } from 'nanoid';

import { useTranslationContext } from '../../context/TranslationContext';
import { useChatContext } from '../../context/ChatContext';

import type { Message } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../types/types';

export const EmojiIconLarge = () => {
  const { t } = useTranslationContext('EmojiIconLarge');

  return (
    <svg height='28' width='28' xmlns='http://www.w3.org/2000/svg'>
      <title>{t<string>('Open emoji picker')}</title>
      <g clipRule='evenodd' fillRule='evenodd'>
        <path d='M14 4.4C8.6 4.4 4.4 8.6 4.4 14c0 5.4 4.2 9.6 9.6 9.6c5.4 0 9.6-4.2 9.6-9.6c0-5.4-4.2-9.6-9.6-9.6zM2 14c0-6.6 5.4-12 12-12s12 5.4 12 12s-5.4 12-12 12s-12-5.4-12-12zM12.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM18.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM8.6 15.4c.6-.4 1.2-.2 1.6.2c.6.8 1.6 1.8 3 2c1.2.4 2.8.2 4.8-2c.4-.4 1.2-.6 1.6 0c.4.4.6 1.2 0 1.6c-2.2 2.6-4.8 3.4-7 3c-2-.4-3.6-1.8-4.4-3c-.4-.6-.2-1.2.4-1.8z' />
      </g>
    </svg>
  );
};

export const EmojiIconSmall = () => {
  const { t } = useTranslationContext('EmojiIconSmall');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t<string>('Open emoji picker')}</title>
      <g clipRule='evenodd' fillRule='evenodd'>
        <path d='M6.7 1.42C3.73 1.42 1.42 3.73 1.42 6.7c0 2.97 2.31 5.28 5.28 5.28c2.97 0 5.28-2.31 5.28-5.28c0-2.97-2.31-5.28-5.28-5.28zM.1 6.7c0-3.63 2.97-6.6 6.6-6.6s6.6 2.97 6.6 6.6s-2.97 6.6-6.6 6.6s-6.6-2.97-6.6-6.6zM6.04 5.05c0 .55-.44.99-.99.99s-.99-.44-.99-.99s.44-.99.99-.99s.99.44.99.99zM9.34 5.05c0 .55-.44.99-.99.99s-.99-.44-.99-.99s.44-.99.99-.99s.99.44.99.99zM3.73 7.47c.33-.22.66-.11.88.11c.33.44.88.99 1.65 1.1c.66.22 1.54.11 2.64-1.1c.22-.22.66-.33.88 0c.22.22.33.66 0 .88c-1.21 1.43-2.64 1.87-3.85 1.65c-1.1-.22-1.98-.99-2.42-1.65c-.22-.33-.11-.66.22-.99z' />
      </g>
    </svg>
  );
};

// ThemingV2 icon
export const EmojiPickerIcon = () => (
  <svg
    preserveAspectRatio='xMinYMin'
    viewBox='0 0 28 28'
    width='100%'
    xmlns='http://www.w3.org/2000/svg'
  >
    <g clipRule='evenodd' fillRule='evenodd'>
      <path d='M14 4.4C8.6 4.4 4.4 8.6 4.4 14c0 5.4 4.2 9.6 9.6 9.6c5.4 0 9.6-4.2 9.6-9.6c0-5.4-4.2-9.6-9.6-9.6zM2 14c0-6.6 5.4-12 12-12s12 5.4 12 12s-5.4 12-12 12s-12-5.4-12-12zM12.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM18.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM8.6 15.4c.6-.4 1.2-.2 1.6.2c.6.8 1.6 1.8 3 2c1.2.4 2.8.2 4.8-2c.4-.4 1.2-.6 1.6 0c.4.4.6 1.2 0 1.6c-2.2 2.6-4.8 3.4-7 3c-2-.4-3.6-1.8-4.4-3c-.4-.6-.2-1.2.4-1.8z'></path>
    </g>
  </svg>
);

export const FileUploadIcon = () => {
  const { t } = useTranslationContext('FileUploadIcon');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t<string>('Attach files')}</title>
      <path
        d='M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z'
        fillRule='nonzero'
      />
    </svg>
  );
};

export const FileUploadIconFlat = () => {
  const { t } = useTranslationContext('FileUploadIconFlat');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t<string>('Attach files')}</title>
      <path
        d='M1.667.333h10.666c.737 0 1.334.597 1.334 1.334v10.666c0 .737-.597 1.334-1.334 1.334H1.667a1.333 1.333 0 0 1-1.334-1.334V1.667C.333.93.93.333 1.667.333zm2 1.334a1.667 1.667 0 1 0 0 3.333 1.667 1.667 0 0 0 0-3.333zm-2 9.333v1.333h10.666v-4l-2-2-4 4-2-2L1.667 11z'
        fillRule='nonzero'
      />
    </svg>
  );
};

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
          <linearGradient id={`${id}-linear-gradient`} x1='50%' x2='50%' y1='0%' y2='100%'>
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

// ThemingV2 icon
export const UploadIcon = () => (
  <svg
    data-testid='attach'
    fill='none'
    height='24'
    viewBox='0 0 24 24'
    width='24'
    xmlns='http://www.w3.org/2000/svg'
  >
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

export const SendIconV1 = () => {
  const { t } = useTranslationContext('SendButton');
  return (
    <svg height='17' viewBox='0 0 18 17' width='18' xmlns='http://www.w3.org/2000/svg'>
      <title>{t<string>('Send')}</title>
      <path
        d='M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z'
        fill='#006cff'
        fillRule='evenodd'
      />
    </svg>
  );
};

export const SendIconV2 = () => {
  const { t } = useTranslationContext('SendButton');
  return (
    <svg
      data-testid='send'
      fill='none'
      height='24'
      viewBox='0 0 24 24'
      width='24'
      xmlns='http://www.w3.org/2000/svg'
    >
      <title>{t<string>('Send')}</title>
      <path
        d='M4.00952 22L24 12L4.00952 2L4 9.77778L18.2857 12L4 14.2222L4.00952 22Z'
        fill='black'
      ></path>
    </svg>
  );
};

export type SendButtonProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => void;
} & React.ComponentProps<'button'>;

export const SendButton = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>({
  sendMessage,
  ...rest
}: SendButtonProps<StreamChatGenerics>) => {
  const { themeVersion } = useChatContext('SendButton');

  return (
    <button
      aria-label='Send'
      className='str-chat__send-button'
      data-testid='send-button'
      onClick={sendMessage}
      type='button'
      {...rest}
    >
      {themeVersion === '2' ? <SendIconV2 /> : <SendIconV1 />}
    </button>
  );
};
