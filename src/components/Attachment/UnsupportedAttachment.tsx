import React from 'react';
import type { Attachment } from 'stream-chat';
import { useComponentContext, useTranslationContext } from '../../context';
import { IconUnsupportedAttachment as DefaultIconUnsupportedAttachment } from '../Icons';

export type UnsupportedAttachmentProps = {
  attachment: Attachment;
};

export const UnsupportedAttachment = () => {
  const { icons: { IconUnsupportedAttachment = DefaultIconUnsupportedAttachment } = {} } =
    useComponentContext();

  const { t } = useTranslationContext('UnsupportedAttachment');
  return (
    <div
      className='str-chat__message-attachment-unsupported'
      data-testid='attachment-unsupported'
    >
      <IconUnsupportedAttachment />
      <div className='str-chat__message-attachment-unsupported__metadata'>
        <div
          className='str-chat__message-attachment-unsupported__title'
          data-testid='unsupported-attachment-title'
        >
          {t('Unsupported attachment')}
        </div>
      </div>
    </div>
  );
};
