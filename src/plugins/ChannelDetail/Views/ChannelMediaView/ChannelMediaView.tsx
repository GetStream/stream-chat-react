import clsx from 'clsx';
import React, { useCallback, useMemo, useState } from 'react';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { formatTime } from '../../../../components/AudioPlayback';
import { Avatar } from '../../../../components/Avatar';
import { Badge } from '../../../../components/Badge';
import {
  type BaseImageProps,
  BaseImage as DefaultBaseImage,
} from '../../../../components/BaseImage';
import { Prompt } from '../../../../components/Dialog';
import { Gallery as DefaultGallery, GalleryUI } from '../../../../components/Gallery';
import { IconImage, IconVideoFill } from '../../../../components/Icons';
import { InfiniteScrollPaginator } from '../../../../components/InfiniteScrollPaginator/InfiniteScrollPaginator';
import { GlobalModal } from '../../../../components/Modal';
import {
  SectionNavigatorHeader,
  type SectionNavigatorSectionContentProps,
} from '../../SectionNavigator';
import { ChannelDetailListLoadingIndicator } from '../../ChannelDetailListLoadingIndicator';
import { getUserDisplayName } from '../ChannelMembersView/ChannelMembersView.utils';
import { ChannelMediaEmptyList } from './ChannelMediaEmptyList';
import type { ChannelMediaItem } from './ChannelMediaView.utils';
import { useChannelMediaSearch } from './useChannelMediaSearch';

type ChannelMediaGridItemProps = {
  BaseImage: React.ComponentType<BaseImageProps>;
  item: ChannelMediaItem;
  onClick: () => void;
};

const ChannelMediaGridItem = ({
  BaseImage,
  item,
  onClick,
}: ChannelMediaGridItemProps) => {
  const { t } = useTranslationContext('ChannelMediaView');
  const displayName = getUserDisplayName(item.user);
  const mediaSrc =
    item.type === 'video'
      ? item.galleryItem.videoThumbnailUrl
      : item.galleryItem.imageUrl;
  const durationLabel = formatTime(item.durationSeconds, 'floor');
  const label =
    item.type === 'video'
      ? t('aria/Open video shared by {{ name }}', { name: displayName })
      : t('aria/Open image shared by {{ name }}', { name: displayName });

  return (
    <button
      aria-label={label}
      className='str-chat__channel-detail__media-view__item'
      onClick={onClick}
      type='button'
    >
      {mediaSrc ? (
        <BaseImage
          alt={item.galleryItem.alt ?? item.galleryItem.title ?? ''}
          className='str-chat__channel-detail__media-view__item__media'
          src={mediaSrc}
        />
      ) : (
        <div
          aria-hidden='true'
          className='str-chat__channel-detail__media-view__item__placeholder'
        >
          <IconImage />
        </div>
      )}
      <Avatar
        aria-hidden='true'
        className='str-chat__channel-detail__media-view__item__avatar'
        imageUrl={item.user?.image}
        size='sm'
        userName={displayName}
      />
      {item.type === 'video' && (
        <Badge
          className='str-chat__channel-detail__media-view__item__duration'
          size='sm'
          variant='inverse'
        >
          <IconVideoFill className='str-chat__channel-detail__media-view__item__duration-icon' />
          {durationLabel ? <span>{durationLabel}</span> : null}
        </Badge>
      )}
    </button>
  );
};

export type ChannelMediaViewProps = SectionNavigatorSectionContentProps;

export const ChannelMediaView: React.ComponentType<ChannelMediaViewProps> = () => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const {
    BaseImage = DefaultBaseImage,
    Gallery = DefaultGallery,
    Modal = GlobalModal,
  } = useComponentContext();
  const { channelMediaSearchSource, hasResultsLoaded, mediaItems } =
    useChannelMediaSearch();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const galleryItems = useMemo(
    () => mediaItems.map((item) => item.galleryItem),
    [mediaItems],
  );

  const openViewer = useCallback((index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  return (
    <div className='str-chat__channel-detail__media-view'>
      <SectionNavigatorHeader close={close} title={t('Photos & videos')} />
      <Prompt.Body className='str-chat__channel-detail__media-view__body'>
        <InfiniteScrollPaginator
          className='str-chat__channel-detail__media-view__grid'
          loadNextOnScrollToBottom={channelMediaSearchSource.search}
        >
          {mediaItems.length > 0 ? (
            <div className='str-chat__channel-detail__media-view__grid__items'>
              {mediaItems.map((item, index) => (
                <ChannelMediaGridItem
                  BaseImage={BaseImage}
                  item={item}
                  key={item.id}
                  onClick={() => openViewer(index)}
                />
              ))}
            </div>
          ) : hasResultsLoaded ? (
            <ChannelMediaEmptyList />
          ) : null}
          <ChannelDetailListLoadingIndicator searchSource={channelMediaSearchSource} />
        </InfiniteScrollPaginator>
      </Prompt.Body>
      <Modal
        className={clsx(
          'str-chat__gallery-modal',
          'str-chat__channel-detail__media-view__viewer',
        )}
        onClose={closeViewer}
        open={viewerOpen}
      >
        <Gallery
          GalleryUI={GalleryUI}
          initialIndex={selectedIndex}
          items={galleryItems}
          onRequestClose={closeViewer}
        />
      </Modal>
    </div>
  );
};
