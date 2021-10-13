import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

import type { Message } from 'stream-chat';

import type { DefaultAttachmentType, DefaultMessageType, DefaultUserType } from '../../types/types';

export const EmojiIconLarge: React.FC = () => {
  const { t } = useTranslationContext('EmojiIconLarge');

  return (
    <svg height='28' width='28' xmlns='http://www.w3.org/2000/svg'>
      <title>{t('Open emoji picker')}</title>
      <g clipRule='evenodd' fillRule='evenodd'>
        <path d='M14 4.4C8.6 4.4 4.4 8.6 4.4 14c0 5.4 4.2 9.6 9.6 9.6c5.4 0 9.6-4.2 9.6-9.6c0-5.4-4.2-9.6-9.6-9.6zM2 14c0-6.6 5.4-12 12-12s12 5.4 12 12s-5.4 12-12 12s-12-5.4-12-12zM12.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM18.8 11c0 1-.8 1.8-1.8 1.8s-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8s1.8.8 1.8 1.8zM8.6 15.4c.6-.4 1.2-.2 1.6.2c.6.8 1.6 1.8 3 2c1.2.4 2.8.2 4.8-2c.4-.4 1.2-.6 1.6 0c.4.4.6 1.2 0 1.6c-2.2 2.6-4.8 3.4-7 3c-2-.4-3.6-1.8-4.4-3c-.4-.6-.2-1.2.4-1.8z'></path>
      </g>
    </svg>
  );
};

export const EmojiIconSmall: React.FC = () => {
  const { t } = useTranslationContext('EmojiIconSmall');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t('Open emoji picker')}</title>
      <g clipRule='evenodd' fillRule='evenodd'>
        <path d='M6.7 1.42C3.73 1.42 1.42 3.73 1.42 6.7c0 2.97 2.31 5.28 5.28 5.28c2.97 0 5.28-2.31 5.28-5.28c0-2.97-2.31-5.28-5.28-5.28zM.1 6.7c0-3.63 2.97-6.6 6.6-6.6s6.6 2.97 6.6 6.6s-2.97 6.6-6.6 6.6s-6.6-2.97-6.6-6.6zM6.04 5.05c0 .55-.44.99-.99.99s-.99-.44-.99-.99s.44-.99.99-.99s.99.44.99.99zM9.34 5.05c0 .55-.44.99-.99.99s-.99-.44-.99-.99s.44-.99.99-.99s.99.44.99.99zM3.73 7.47c.33-.22.66-.11.88.11c.33.44.88.99 1.65 1.1c.66.22 1.54.11 2.64-1.1c.22-.22.66-.33.88 0c.22.22.33.66 0 .88c-1.21 1.43-2.64 1.87-3.85 1.65c-1.1-.22-1.98-.99-2.42-1.65c-.22-.33-.11-.66.22-.99z'></path>
      </g>
    </svg>
  );
};

export const FileUploadIcon: React.FC = () => {
  const { t } = useTranslationContext('FileUploadIcon');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t('Attach files')}</title>
      <path
        d='M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z'
        fillRule='nonzero'
      />
    </svg>
  );
};

export const FileUploadIconFlat: React.FC = () => {
  const { t } = useTranslationContext('FileUploadIconFlat');

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t('Attach files')}</title>
      <path
        d='M1.667.333h10.666c.737 0 1.334.597 1.334 1.334v10.666c0 .737-.597 1.334-1.334 1.334H1.667a1.333 1.333 0 0 1-1.334-1.334V1.667C.333.93.93.333 1.667.333zm2 1.334a1.667 1.667 0 1 0 0 3.333 1.667 1.667 0 0 0 0-3.333zm-2 9.333v1.333h10.666v-4l-2-2-4 4-2-2L1.667 11z'
        fillRule='nonzero'
      />
    </svg>
  );
};

export type SendButtonProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Me extends DefaultMessageType = DefaultMessageType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  sendMessage: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<At, Me, Us>>,
  ) => void;
};

export const SendButton = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Me extends DefaultMessageType = DefaultMessageType,
  Us extends DefaultUserType<Us> = DefaultUserType
>({
  sendMessage,
}: SendButtonProps<At, Me, Us>) => {
  const { t } = useTranslationContext('SendButton');

  return (
    <button className='str-chat__send-button' onClick={sendMessage}>
      <svg height='17' viewBox='0 0 18 17' width='18' xmlns='http://www.w3.org/2000/svg'>
        <title>{t('Send')}</title>
        <path
          d='M0 17.015l17.333-8.508L0 0v6.617l12.417 1.89L0 10.397z'
          fill='#006cff'
          fillRule='evenodd'
        />
      </svg>
    </button>
  );
};
