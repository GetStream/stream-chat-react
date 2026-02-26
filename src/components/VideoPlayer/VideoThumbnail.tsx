import { BaseImage, type BaseImageProps } from '../Gallery';
import { Button } from '../Button';
import clsx from 'clsx';
import { IconPlaySolid } from '../Icons';
import React from 'react';
import { useTranslationContext } from '../../context';

export type VideoThumbnailProps = BaseImageProps & {
  onPlay?: () => void;
};

export const VideoThumbnail = ({
  className,
  onPlay,
  ...imageProps
}: VideoThumbnailProps) => {
  const { t } = useTranslationContext();

  return (
    <div className='str-chat__message-attachment__video-thumbnail'>
      <BaseImage
        className={clsx('str-chat__message-attachment__video-thumbnail-image', className)}
        {...imageProps}
      />
      {onPlay ? (
        <Button
          appearance='solid'
          aria-label={t('Play video')}
          circular
          className={clsx(
            'str-chat__message-attachment__video-thumbnail__play-indicator',
          )}
          onClick={onPlay}
          size='lg'
          variant='secondary'
        >
          <IconPlaySolid />
        </Button>
      ) : (
        <div className='str-chat__message-attachment__video-thumbnail__play-indicator'>
          <IconPlaySolid />
        </div>
      )}
    </div>
  );
};
