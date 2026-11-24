import React from 'react';

import { useComponentContextIcons, useTranslationContext } from '../../../../context';

// The photos and videos view's empty state.

/**
 * A channel without photos or videos: the image icon, "No photos or videos" and how to share one.
 */
export const ChannelMediaEmpty = () => {
  const { IconImage } = useComponentContextIcons();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__channel-detail__media-view__empty-state'>
      <IconImage className='str-chat__channel-detail__media-view__empty-state__icon' />
      <div className='str-chat__channel-detail__media-view__empty-state__content'>
        <p className='str-chat__channel-detail__media-view__empty-state__title'>
          {t(
            'channelDetail.channelMediaEmpty.noPhotosVideos.text',
            'No photos or videos',
          )}
        </p>
        <p className='str-chat__channel-detail__media-view__empty-state__description'>
          {t(
            'channelDetail.channelMediaEmpty.sharePhotoVideoSee.text',
            'Share a photo or video to see it here',
          )}
        </p>
      </div>
    </div>
  );
};
