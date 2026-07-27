import clsx from 'clsx';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import {
  useComponentContext,
  useModalContext,
  useTranslationContext,
} from '../../../../context';
import { formatTime } from '../../../../components/AudioPlayback';
import { Avatar as DefaultAvatar } from '../../../../components/Avatar';
import { extractDisplayInfo as defaultExtractDisplayInfo } from '../../../../components/Avatar/utils';
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

// Default items rendered per grid page (5 columns x 6 rows). Overridable via the
// `itemsPerPage` prop. Intentionally decoupled from the search source's message
// page size: a message carries a variable number of attachments, so message
// pages and attachment pages don't align.
const DEFAULT_CHANNEL_MEDIA_ITEMS_PER_PAGE = 30;

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
  const { Avatar = DefaultAvatar, extractDisplayInfo = defaultExtractDisplayInfo } =
    useComponentContext();
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
        {...extractDisplayInfo({ user: item.user })}
        aria-hidden='true'
        className='str-chat__channel-detail__media-view__item__avatar'
        size='sm'
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

export type ChannelMediaViewProps = SectionNavigatorSectionContentProps & {
  /** Number of media items rendered per grid page. Defaults to 30. */
  itemsPerPage?: number;
};

export const ChannelMediaView: React.ComponentType<ChannelMediaViewProps> = ({
  itemsPerPage = DEFAULT_CHANNEL_MEDIA_ITEMS_PER_PAGE,
}) => {
  const { t } = useTranslationContext();
  const { close } = useModalContext();
  const {
    BaseImage = DefaultBaseImage,
    Gallery = DefaultGallery,
    Modal = GlobalModal,
  } = useComponentContext();
  const { channelMediaSearchSource, hasNext, hasResultsLoaded, isLoading, mediaItems } =
    useChannelMediaSearch();

  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const gridRef = useRef<HTMLDivElement>(null);
  // Set when "Next" reached a page that isn't loaded yet; the fill effect below
  // advances to it once the fetched attachments land, keeping fetches triggered
  // only by the button (or the initial mount load).
  const pendingNextRef = useRef(false);

  const galleryItems = useMemo(
    () => mediaItems.map((item) => item.galleryItem),
    [mediaItems],
  );

  const pageStart = page * itemsPerPage;
  const pageItems = useMemo(
    () => mediaItems.slice(pageStart, pageStart + itemsPerPage),
    [mediaItems, itemsPerPage, pageStart],
  );

  // More items already loaded beyond this page, or the source can fetch more.
  const canGoNext = mediaItems.length > pageStart + itemsPerPage || hasNext;
  const showPagination =
    mediaItems.length > itemsPerPage || (mediaItems.length > 0 && hasNext);

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
    const nextPageStart = (page + 1) * itemsPerPage;
    if (mediaItems.length > nextPageStart) {
      // The next page is already backed by loaded attachments — advance now.
      setPage(page + 1);
    } else if (hasNext) {
      // The next page isn't loaded yet. Request more and let the fill effect
      // advance once enough attachments arrive. Only a ref changes here (no
      // re-render), so the fetch fires exactly once per click.
      pendingNextRef.current = true;
      void channelMediaSearchSource.search();
    }
  }, [channelMediaSearchSource, hasNext, itemsPerPage, mediaItems.length, page]);

  // Forward-fill loop. Because a message yields a variable number of
  // attachments, one fetch may not fill a grid page (and the very first page
  // can arrive short). Keep pulling message pages until the visible page is
  // full or the channel is exhausted; nothing is ever discarded, so paging to
  // the end always reveals every attachment. Also resolves a pending "Next" by
  // advancing once its target page has data.
  useEffect(() => {
    if (isLoading) return;

    if (pendingNextRef.current) {
      const nextPageStart = (page + 1) * itemsPerPage;
      if (mediaItems.length > nextPageStart) {
        pendingNextRef.current = false;
        setPage((current) => current + 1);
        return;
      }
      if (!hasNext) {
        pendingNextRef.current = false;
        return;
      }
      void channelMediaSearchSource.search();
      return;
    }

    // Top up the visible page (covers the first page on mount).
    const need = pageStart + itemsPerPage;
    if (mediaItems.length < need && hasNext) {
      void channelMediaSearchSource.search();
    }
  }, [
    channelMediaSearchSource,
    hasNext,
    isLoading,
    itemsPerPage,
    mediaItems.length,
    page,
    pageStart,
  ]);

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
