import React, { useCallback, useMemo, useState } from 'react';
import clsx from 'clsx';

import type { BaseImageProps, GalleryItem } from '../Gallery';
import {
  BaseImage as DefaultBaseImage,
  Gallery as DefaultGallery,
  GalleryUI,
} from '../Gallery';
import { GlobalModal } from '../Modal';
import { useComponentContext, useTranslationContext } from '../../context';
import { IconArrowRotateClockwise } from '../Icons';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';
import { CloseButtonOnModalOverlay } from '../Modal/CloseButtonOnModalOverlay';

const MAX_VISIBLE_THUMBNAILS = 4;
const RETRY_QUERY_KEY = 'str-chat-retry';

export type ModalGalleryProps = {
  /** Array of media attachments to display */
  items: GalleryItem[];
  className?: string;
  modalClassName?: string;
};

export const ModalGallery = ({ className, items, modalClassName }: ModalGalleryProps) => {
  const {
    BaseImage = DefaultBaseImage,
    Gallery = DefaultGallery,
    Modal = GlobalModal,
  } = useComponentContext();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const usesDefaultBaseImage = BaseImage === DefaultBaseImage;

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const handleThumbnailClick = useCallback((index: number) => {
    setSelectedIndex(index);
    setModalOpen(true);
  }, []);

  const itemCount = items.length;
  const visibleItems = items.slice(0, MAX_VISIBLE_THUMBNAILS);
  const overflowCount = itemCount - MAX_VISIBLE_THUMBNAILS;

  return (
    <>
      <div
        className={clsx('str-chat__modal-gallery', className, {
          'str-chat__modal-gallery--three-images': itemCount === 3,
          'str-chat__modal-gallery--two-images': itemCount === 2,
        })}
      >
        {visibleItems.map((item, index) => {
          const isLastVisible = index === MAX_VISIBLE_THUMBNAILS - 1;
          const showOverlay = isLastVisible && overflowCount > 0;

          return (
            <ThumbnailButton
              BaseImage={BaseImage}
              baseImageUsesDefaultBehavior={usesDefaultBaseImage}
              index={index}
              item={item}
              itemCount={itemCount}
              key={index}
              onClick={() => handleThumbnailClick(index)}
              overflowCount={overflowCount}
              showOverlay={showOverlay}
            />
          );
        })}
      </div>
      <Modal
        className={clsx('str-chat__gallery-modal', modalClassName)}
        CloseButtonOnOverlay={CloseButtonOnModalOverlay}
        onClose={closeModal}
        open={modalOpen}
      >
        <Gallery GalleryUI={GalleryUI} initialIndex={selectedIndex} items={items} />
      </Modal>
    </>
  );
};

type ThumbnailButtonProps = {
  BaseImage: React.ComponentType<BaseImageProps>;
  baseImageUsesDefaultBehavior: boolean;
  index: number;
  item: GalleryItem;
  itemCount: number;
  onClick: () => void;
  overflowCount: number;
  showOverlay: boolean;
};

const ThumbnailButton = ({
  BaseImage,
  baseImageUsesDefaultBehavior,
  index,
  item,
  itemCount,
  onClick,
  overflowCount,
  showOverlay,
}: ThumbnailButtonProps) => {
  const { t } = useTranslationContext();
  const [isLoadFailed, setIsLoadFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const imageUrl = item.imageUrl;
  const {
    onError: itemOnError,
    onLoad: itemOnLoad,
    ...baseImageProps
  } = getBaseImageProps(item);
  const retryImageUrl = useMemo(
    () => getRetryImageUrl(imageUrl, retryCount),
    [imageUrl, retryCount],
  );
  const showRetryIndicator = isLoadFailed && !showOverlay;

  const handleButtonClick = () => {
    if (showRetryIndicator) {
      setIsLoadFailed(false);
      setRetryCount((currentRetryCount) => currentRetryCount + 1);
      return;
    }

    onClick();
  };

  const buttonLabel = showRetryIndicator
    ? t('aria/Retry upload')
    : itemCountAwareLabel({ imageIndex: index + 1, itemCount, t });

  return (
    <button
      aria-label={buttonLabel}
      className={clsx('str-chat__modal-gallery__image', {
        'str-chat__modal-gallery__image--load-failed': showRetryIndicator,
      })}
      onClick={handleButtonClick}
      type='button'
    >
      {item.videoThumbnailUrl ? (
        <VideoThumbnail alt={t('User uploaded content')} src={item.videoThumbnailUrl} />
      ) : (
        <BaseImage
          {...baseImageProps}
          alt={item.alt ?? t('User uploaded content')}
          onError={(event) => {
            setIsLoadFailed(true);
            itemOnError?.(event);
          }}
          onLoad={(event) => {
            setIsLoadFailed(false);
            itemOnLoad?.(event);
          }}
          src={retryImageUrl}
          {...(baseImageUsesDefaultBehavior ? { showDownloadButtonOnError: false } : {})}
        />
      )}
      {showRetryIndicator && (
        <div
          aria-hidden='true'
          className='str-chat__modal-gallery__image-load-failed-overlay'
          data-testid='str-chat__modal-gallery__image-load-failed-overlay'
        >
          <div className='str-chat__modal-gallery__image-retry-indicator'>
            <IconArrowRotateClockwise />
          </div>
        </div>
      )}
      {showOverlay && (
        <div className='str-chat__modal-gallery__placeholder'>+{overflowCount}</div>
      )}
    </button>
  );
};

const itemCountAwareLabel = ({
  imageIndex,
  itemCount,
  t,
}: {
  imageIndex: number;
  itemCount: number;
  t: ReturnType<typeof useTranslationContext>['t'];
}) =>
  itemCount === 1
    ? t('Open image in gallery')
    : t('Open gallery at image {{ index }}', {
        index: imageIndex,
      });

const getRetryImageUrl = (imageUrl?: string, retryCount = 0) => {
  if (!imageUrl || retryCount === 0 || /^(blob:|data:)/i.test(imageUrl)) return imageUrl;

  const [baseUrl, hash = ''] = imageUrl.split('#');
  const separator = baseUrl.includes('?') ? '&' : '?';

  return `${baseUrl}${separator}${RETRY_QUERY_KEY}=${retryCount}${hash ? `#${hash}` : ''}`;
};

const getBaseImageProps = (item: GalleryItem): Omit<BaseImageProps, 'src'> => {
  const {
    className,
    crossOrigin,
    decoding,
    draggable,
    fetchPriority,
    height,
    loading,
    onError,
    onLoad,
    ref,
    sizes,
    srcSet,
    style,
    title,
    useMap,
    width,
  } = item;

  return {
    className,
    crossOrigin,
    decoding,
    draggable,
    fetchPriority,
    height,
    loading,
    onError,
    onLoad,
    ref,
    sizes,
    srcSet,
    style,
    title,
    useMap,
    width,
  };
};
