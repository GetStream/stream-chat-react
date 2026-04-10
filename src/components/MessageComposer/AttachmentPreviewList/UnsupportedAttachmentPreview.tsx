import React from 'react';
import type { AnyLocalAttachment, LocalUploadAttachment } from 'stream-chat';
import { IconUnsupportedAttachment } from '../../Icons';
import { useTranslationContext } from '../../../context';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';

export type UnsupportedAttachmentPreviewProps<
  CustomLocalMetadata = Record<string, unknown>,
> = {
  attachment: AnyLocalAttachment<CustomLocalMetadata>;
  handleRetry: (
    attachment: LocalUploadAttachment,
  ) => void | Promise<LocalUploadAttachment | undefined>;
  removeAttachments: (ids: string[]) => void;
};

export const UnsupportedAttachmentPreview = ({
  attachment,
  removeAttachments,
}: UnsupportedAttachmentPreviewProps) => {
  const { t } = useTranslationContext();
  const { id } = attachment.localMetadata ?? {};

  return (
    <div
      className='str-chat__attachment-preview-unsupported'
      data-testid='attachment-preview-unsupported'
    >
      <IconUnsupportedAttachment />
      <div className='str-chat__attachment-preview-unsupported__metadata'>
        <div
          className='str-chat__attachment-preview-unsupported__title'
          data-testid='unsupported-attachment-preview-title'
        >
          {t('Unsupported attachment')}
        </div>
      </div>
      <RemoveAttachmentPreviewButton
        data-testid='file-preview-item-delete-button'
        onClick={() => {
          if (id) removeAttachments([id]);
        }}
      />
    </div>
  );
};
