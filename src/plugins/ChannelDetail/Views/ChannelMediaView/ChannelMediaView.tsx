import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

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
import {
  IconChevronLeft,
  IconChevronRight,
  IconImage,
  IconVideoFill,
} from '../../../../components/Icons';
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
import { Button } from '../../../../components';

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

type ChannelMediaPaginationProps = {
  nextDisabled: boolean;
  onNext: () => void;
  onPrevious: () => void;
  previousDisabled: boolean;
};

const ChannelMediaPagination = ({
  nextDisabled,
  onNext,
  onPrevious,
  previousDisabled,
}: ChannelMediaPaginationProps) => {
  const { t } = useTranslationContext('ChannelMediaView');

  return (
    <div className='str-chat__channel-detail__media-view__pagination'>
      <Button
        appearance='outline'
        aria-label={t('aria/Previous page')}
        className='str-chat__channel-detail__media-view__pagination__button str-chat__channel-detail__media-view__pagination__button--previous'
        disabled={previousDisabled}
        onClick={onPrevious}
        size='md'
        variant='secondary'
      >
        <IconChevronLeft />
        {t('Previous')}
      </Button>
      <Button
        appearance='outline'
        aria-label={t('aria/Next page')}
        className='str-chat__channel-detail__media-view__pagination__button str-chat__channel-detail__media-view__pagination__button--next'
        disabled={nextDisabled}
        onClick={onNext}
        size='md'
        variant='secondary'
      >
        {t('Next')}
        <IconChevronRight />
      </Button>
    </div>
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
  const {
    channelMediaSearchSource,
    hasNext,
    hasResultsLoaded,
    isLoading,
    mediaItems,
    pageSize,
  } = useChannelMediaSearch();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  // Set when "Next" needs more items than are loaded; resolved by the effect
  // below once a search settles, keeping fetches button-triggered only.
  const pendingNextRef = useRef(false);

  const galleryItems = useMemo(
    () => mediaItems.map((item) => item.galleryItem),
    [mediaItems],
  );

  const pageStart = page * pageSize;
  const pageItems = useMemo(
    () => mediaItems.slice(pageStart, pageStart + pageSize),
    [mediaItems, pageSize, pageStart],
  );

  // More items already loaded beyond this page, or the source can fetch more.
  const canGoNext = mediaItems.length > pageStart + pageSize || hasNext;
  const showPagination =
    mediaItems.length > pageSize || (mediaItems.length > 0 && hasNext);

  const openViewer = useCallback((index: number) => {
    setSelectedIndex(index);
    setViewerOpen(true);
  }, []);

  const closeViewer = useCallback(() => {
    setViewerOpen(false);
  }, []);

  const goToPreviousPage = useCallback(() => {
    pendingNextRef.current = false;
    setPage((current) => Math.max(0, current - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    const nextPageStart = (page + 1) * pageSize;
    if (mediaItems.length > nextPageStart) {
      setPage(page + 1);
    } else if (hasNext) {
      // Defer advancing until the freshly fetched page lands (see effect below).
      pendingNextRef.current = true;
      void channelMediaSearchSource.search();
    }
  }, [channelMediaSearchSource, hasNext, mediaItems.length, page, pageSize]);

  // Resolve a deferred "Next": once a search settles, advance to the page now
  // backed by data, or keep pulling if the source returned too few items.
  useEffect(() => {
    if (!pendingNextRef.current || isLoading) return;

    const nextPageStart = (page + 1) * pageSize;
    if (mediaItems.length > nextPageStart) {
      pendingNextRef.current = false;
      setPage((current) => current + 1);
    } else if (hasNext) {
      void channelMediaSearchSource.search();
    } else {
      pendingNextRef.current = false;
    }
  }, [channelMediaSearchSource, hasNext, isLoading, mediaItems.length, page, pageSize]);

  // Each page replaces the previous one, so reset the grid scroll on change.
  useEffect(() => {
    const grid = gridRef.current;
    if (typeof grid?.scrollTo === 'function') {
      grid.scrollTo({ top: 0 });
    } else if (grid) {
      grid.scrollTop = 0;
    }
  }, [page]);

  return (
    <div className='str-chat__channel-detail__media-view'>
      <SectionNavigatorHeader close={close} title={t('Photos & videos')} />
      <Prompt.Body className='str-chat__channel-detail__media-view__body'>
        <div className='str-chat__channel-detail__media-view__grid' ref={gridRef}>
          <div className='str-chat__channel-detail__media-view__grid__content'>
            {pageItems.length > 0 ? (
              <div className='str-chat__channel-detail__media-view__grid__items'>
                {pageItems.map((item, index) => (
                  <ChannelMediaGridItem
                    BaseImage={BaseImage}
                    item={item}
                    key={item.id}
                    onClick={() => openViewer(pageStart + index)}
                  />
                ))}
              </div>
            ) : hasResultsLoaded ? (
              <ChannelMediaEmptyList />
            ) : null}
            <ChannelDetailListLoadingIndicator searchSource={channelMediaSearchSource} />
            {showPagination && (
              <ChannelMediaPagination
                nextDisabled={!canGoNext || isLoading}
                onNext={goToNextPage}
                onPrevious={goToPreviousPage}
                previousDisabled={page === 0}
              />
            )}
          </div>
        </div>
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
