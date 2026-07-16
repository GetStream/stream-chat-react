import React from 'react';
import { useMessageContext, useTranslationContext } from '../../context';
import {
  ContextMenuBackButton,
  ContextMenuButton,
  ContextMenuHeader,
  useContextMenuContext,
} from '../Dialog';
import { IconChevronLeft, IconDownload } from '../Icons';
import {
  type DownloadableAttachment,
  downloadAllAttachments,
  downloadAttachment,
  isDownloadableAttachment,
} from './downloadUtils';

const msgActionsBoxButtonClassName =
  'str-chat__message-actions-list-item-button' as const;

export const DownloadSubmenuHeader = () => {
  const { returnToParentMenu: goBack } = useContextMenuContext();
  const { t } = useTranslationContext();
  return (
    <ContextMenuHeader>
      <ContextMenuBackButton onClick={goBack}>
        <IconChevronLeft />
        <span>{t('Download Attachment')}</span>
      </ContextMenuBackButton>
    </ContextMenuHeader>
  );
};

export const DownloadSubmenu = () => {
  const { closeMenu } = useContextMenuContext();
  const { message } = useMessageContext();
  const { t } = useTranslationContext();

  // TODO: something here is improperly typed
  const downloadableAttachments = (message.attachments ?? []).filter(
    isDownloadableAttachment,
  ) as DownloadableAttachment[];

  return (
    <div className='str-chat__message-actions-box__submenu str-chat__message-actions-box__submenu--download-attachments'>
      {downloadableAttachments.map((attachment, index) => {
        const fileName = attachment.localMetadata?.file?.name ?? attachment.title;
        const label = fileName
          ? t('Download {{ fileName }}', { fileName })
          : t('Download attachment {{ number }}', { number: index + 1 });

        return (
          <ContextMenuButton
            className={msgActionsBoxButtonClassName}
            Icon={IconDownload}
            key={
              attachment.localMetadata?.id ??
              attachment.asset_url ??
              attachment.image_url ??
              `${fileName ?? 'attachment'}-${index}`
            }
            onClick={() => {
              void downloadAttachment(attachment);
              closeMenu();
            }}
          >
            {label}
          </ContextMenuButton>
        );
      })}
      <ContextMenuButton
        className={msgActionsBoxButtonClassName}
        Icon={IconDownload}
        onClick={() => {
          void downloadAllAttachments(downloadableAttachments);
          closeMenu();
        }}
      >
        {t('Download All')}
      </ContextMenuButton>
    </div>
  );
};
