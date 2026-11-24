import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../../../context';

// The files view's empty state.

/** A channel without files: the folder icon, "No files" and how to share one. */
export const ChannelFilesEmpty = () => {
  const { IconFolder } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__channel-detail__files-view__empty-state'>
      <IconFolder className='str-chat__channel-detail__files-view__empty-state__icon' />
      <div className='str-chat__channel-detail__files-view__empty-state__content'>
        <p className='str-chat__channel-detail__files-view__empty-state__title'>
          {t('channelDetail.channelFilesEmpty.noFiles.text', 'No files')}
        </p>
        <p className='str-chat__channel-detail__files-view__empty-state__description'>
          {t(
            'channelDetail.channelFilesEmpty.shareFileSee.text',
            'Share a file to see it here',
          )}
        </p>
      </div>
    </div>
  );
};
