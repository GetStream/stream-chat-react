import type { Attachment } from 'stream-chat';
import { useTranslationContext } from '../../../context';
import clsx from 'clsx';
import React from 'react';

export const UnableToRenderCard = ({ type }: { type?: Attachment['type'] }) => {
  const { t } = useTranslationContext('Card');

  return (
    <div
      className={clsx('str-chat__message-attachment-card', {
        [`str-chat__message-attachment-card--${type}`]: type,
      })}
    >
      <div className='str-chat__message-attachment-card--content'>
        <div className='str-chat__message-attachment-card--text'>
          {t('this content could not be displayed')}
        </div>
      </div>
    </div>
  );
};
