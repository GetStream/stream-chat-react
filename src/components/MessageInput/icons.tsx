import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export const EmojiIconLarge: React.FC = () => {
  const { t } = useTranslationContext();

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
  const { t } = useTranslationContext();

  return (
    <svg height='14' width='14' xmlns='http://www.w3.org/2000/svg'>
      <title>{t('Open emoji picker')}</title>
      <path
        d='M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z'
        fillRule='evenodd'
      />
    </svg>
  );
};

export const FileUploadIcon: React.FC = () => {
  const { t } = useTranslationContext();

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
  const { t } = useTranslationContext();

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

export type SendButtonProps = {
  /** Function to send a message to the currently active channel */
  sendMessage: (event: React.BaseSyntheticEvent) => void;
};

export const SendButton: React.FC<SendButtonProps> = ({ sendMessage }) => {
  const { t } = useTranslationContext();

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
