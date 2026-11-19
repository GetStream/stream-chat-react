import { type BaseImageProps, BaseImage as DefaultBaseImage } from '../BaseImage';
import { Button } from '../Button';
import clsx from 'clsx';
import React from 'react';
import {
  useComponentContext,
  useComponentContextIcons,
  useTranslationContext,
} from '../../context';

export type VideoThumbnailProps = BaseImageProps & {
  onPlay?: () => void;
};

export const VideoThumbnail = ({
  className,
  onPlay,
  ...imageProps
}: VideoThumbnailProps) => {
  const { IconPlayFill } = useComponentContextIcons();
  const { BaseImage = DefaultBaseImage } = useComponentContext();
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__message-attachment__video-thumbnail'>
      {imageProps.src ? (
        <BaseImage
          className={clsx(
            'str-chat__message-attachment__video-thumbnail-image',
            className,
          )}
          {...imageProps}
        />
      ) : (
        // A video without a thumbnail shows a blank frame under the play indicator.
        <div
          aria-hidden='true'
          className={clsx(
            'str-chat__message-attachment__video-thumbnail-image',
            'str-chat__message-attachment__video-thumbnail-placeholder',
            className,
          )}
          data-testid='str-chat__video-thumbnail-placeholder'
        />
      )}
      {onPlay ? (
        <Button
          appearance='solid'
          aria-label={t('videoPlayer.videoThumbnail.playVideo.ariaLabel', 'Play video')}
          circular
          className={clsx(
            'str-chat__message-attachment__video-thumbnail__play-indicator',
          )}
          onClick={onPlay}
          size='lg'
          variant='secondary'
        >
          <IconPlayFill />
        </Button>
      ) : (
        <div className='str-chat__message-attachment__video-thumbnail__play-indicator'>
          <IconPlayFill />
        </div>
      )}
    </div>
  );
};
