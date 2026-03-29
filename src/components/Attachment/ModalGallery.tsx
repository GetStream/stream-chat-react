import React, { useCallback, useState } from 'react';
import clsx from 'clsx';

import type { BaseImageProps } from '../BaseImage';
import type { GalleryItem } from '../Gallery/GalleryContext';
import { BaseImage as DefaultBaseImage } from '../BaseImage';
import { Gallery as DefaultGallery, GalleryUI } from '../Gallery';
import { LoadingIndicator } from '../Loading';
import { GlobalModal } from '../Modal';
import { useComponentContext, useTranslationContext } from '../../context';
import { IconRetry } from '../Icons';
import { VideoThumbnail } from '../VideoPlayer/VideoThumbnail';

const MAX_VISIBLE_THUMBNAILS = 4;
const BASE_IMAGE_PROP_KEYS = [
  'className',
  'crossOrigin',
  'decoding',
  'draggable',
  'fetchPriority',
  'height',
  'loading',
  'onError',
  'onLoad',
  'ref',
  'showDownloadButtonOnError',
  'sizes',
  'srcSet',
  'style',
  'title',
  'useMap',
  'width',
] as const satisfies ReadonlyArray<keyof Omit<BaseImageProps, 'src'>>;
type BaseImagePropsWithoutSrc = Omit<BaseImageProps, 'src'>;
type PartialBaseImagePropMap = Partial<
  Record<(typeof BASE_IMAGE_PROP_KEYS)[number], unknown>
>;

export type ModalGalleryProps = {
  /** Array of media attachments to display */
  items: GalleryItem[];
  className?: string;
  /** Whether clicking the empty gallery background should close the modal (default: true) */
  closeOnBackgroundClick?: boolean;
  modalClassName?: string;
};

export const ModalGallery = ({
  className,
  closeOnBackgroundClick = true,
  items,
  modalClassName,
}: ModalGalleryProps) => {
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
        onClose={closeModal}
        open={modalOpen}
      >
        <Gallery
          closeOnBackgroundClick={closeOnBackgroundClick}
          GalleryUI={GalleryUI}
          initialIndex={selectedIndex}
          items={items}
          onRequestClose={closeModal}
        />
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
  const imageUrl = item.imageUrl;
  const [isLoadFailed, setIsLoadFailed] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(Boolean(imageUrl));
  const [retryCount, setRetryCount] = useState(0);

  const {
    onError: itemOnError,
    onLoad: itemOnLoad,
    ...baseImageProps
  } = getBaseImageProps(item);
  const showRetryIndicator = isLoadFailed && !showOverlay;
  const showLoadingIndicator = isImageLoading && !showRetryIndicator && !showOverlay;

  const handleButtonClick = () => {
    if (showRetryIndicator) {
      setIsLoadFailed(false);
      setIsImageLoading(true);
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
        'str-chat__modal-gallery__image--loading': showLoadingIndicator,
      })}
      onClick={handleButtonClick}
      type='button'
    >
      {item.videoThumbnailUrl ? (
        <VideoThumbnail alt={t('User uploaded content')} src={item.videoThumbnailUrl} />
      ) : (
        <BaseImage
          // Remount the image on retry so the browser gets a fresh load attempt and
          // BaseImage clears its local load-failed state.
          key={retryCount}
          {...baseImageProps}
          alt={item.alt ?? t('User uploaded content')}
          onError={(event) => {
            setIsImageLoading(false);
            setIsLoadFailed(true);
            itemOnError?.(event);
          }}
          onLoad={(event) => {
            setIsImageLoading(false);
            setIsLoadFailed(false);
            itemOnLoad?.(event);
          }}
          src={imageUrl}
          {...(baseImageUsesDefaultBehavior ? { showDownloadButtonOnError: false } : {})}
        />
      )}
      {showLoadingIndicator && (
        <div
          aria-hidden='true'
          className='str-chat__modal-gallery__image-loading-overlay'
          data-testid='str-chat__modal-gallery__image-loading-overlay'
        >
          <LoadingIndicator />
        </div>
      )}
      {showRetryIndicator && (
        <div
          aria-hidden='true'
          className='str-chat__modal-gallery__image-load-failed-overlay'
          data-testid='str-chat__modal-gallery__image-load-failed-overlay'
        >
          <div className='str-chat__modal-gallery__image-retry-indicator'>
            <IconRetry />
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

const getBaseImageProps = (item: GalleryItem): BaseImagePropsWithoutSrc => {
  const baseImageProps: PartialBaseImagePropMap = {};
  for (const key of BASE_IMAGE_PROP_KEYS) {
    const value = item[key];
    if (value !== undefined) {
      baseImageProps[key] = value;
    }
  }

  return baseImageProps as BaseImagePropsWithoutSrc;
};
