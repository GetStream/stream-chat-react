import { convertTimestampToDate } from 'stream-chat';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import clsx from 'clsx';

import type { BaseImageProps } from '../BaseImage';
import type { GalleryItem } from '../Gallery/GalleryContext';
import { BaseImage as DefaultBaseImage } from '../BaseImage';
import { Gallery as DefaultGallery, GalleryUI } from '../Gallery';
import { LoadingIndicator } from '../Loading';
import { GlobalModal, type ModalCloseSource } from '../Modal';
import {
  MessageContext,
  useComponentContext,
  useTranslationContext,
} from '../../context';
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
  // ModalGallery is also usable standalone, outside a message
  const { message } = useContext(MessageContext) ?? {};
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  // the gallery header renders outside this provider, so sender and timestamp travel on the items
  const itemsWithSender = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        createdAt: item.createdAt ?? convertTimestampToDate(message?.created_at),
        user: item.user ?? message?.user ?? undefined,
      })),
    [items, message?.created_at, message?.user],
  );
  const usesDefaultBaseImage = BaseImage === DefaultBaseImage;

  const closeModal = useCallback(() => {
    setModalOpen(false);
  }, []);
  const preventOverlayClose = useCallback(
    (source: ModalCloseSource) => source !== 'overlay',
    [],
  );

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
        onCloseAttempt={preventOverlayClose}
        open={modalOpen}
      >
        <Gallery
          closeOnBackgroundClick={closeOnBackgroundClick}
          GalleryUI={GalleryUI}
          initialIndex={selectedIndex}
          items={itemsWithSender}
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
  // Cache-busting suffix appended to image src on retry. Using a suffix instead of
  // a React key remount keeps the component (and its placeholder) mounted, preventing
  // layout shifts and height collapse during the reload attempt.
  const [retrySuffix, setRetrySuffix] = useState('');

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
      setRetrySuffix(`&retry=${Date.now()}`);
      return;
    }

    onClick();
  };

  const buttonLabel = showRetryIndicator
    ? t('common.retryUpload.ariaLabel', 'Retry upload')
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
        <VideoThumbnail
          alt={t('common.userUploadedContent.label', 'User uploaded content')}
          src={item.videoThumbnailUrl}
        />
      ) : (
        <BaseImage
          {...baseImageProps}
          alt={item.alt ?? t('common.userUploadedContent.label', 'User uploaded content')}
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
          src={imageUrl ? `${imageUrl}${retrySuffix}` : imageUrl}
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
    ? t('attachment.modalGallery.openImageGallery.label', 'Open image in gallery')
    : t(
        'attachment.modalGallery.openGalleryImage.label',
        'Open gallery at image {{ index }}',
        {
          index: imageIndex,
        },
      );

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
