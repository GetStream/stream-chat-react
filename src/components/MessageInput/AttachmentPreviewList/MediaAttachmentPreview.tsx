import type { UploadAttachmentPreviewProps } from './types';
import {
  isVideoAttachment,
  type LocalImageAttachment,
  type LocalVideoAttachment,
} from 'stream-chat';
import { useComponentContext, useTranslationContext } from '../../../context';
import { BaseImage as DefaultBaseImage } from '../../Gallery';
import React, {
  type KeyboardEvent,
  type MouseEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import clsx from 'clsx';
import { LoadingIndicatorIcon } from '../icons';
import {
  IconArrowRotateClockwise,
  IconExclamationCircle,
  IconVideoSolid,
} from '../../Icons';
import { RemoveAttachmentPreviewButton } from '../RemoveAttachmentPreviewButton';
import { Button } from '../../Button';
import { AttachmentPreviewRoot } from './utils/AttachmentPreviewRoot';

export type MediaAttachmentPreviewProps<CustomLocalMetadata = Record<string, unknown>> =
  UploadAttachmentPreviewProps<
    LocalVideoAttachment<CustomLocalMetadata> | LocalImageAttachment<CustomLocalMetadata>
  >;

export const MediaAttachmentPreview = ({
  attachment,
  handleRetry,
  removeAttachments,
}: MediaAttachmentPreviewProps) => {
  const { t } = useTranslationContext();
  const { BaseImage = DefaultBaseImage, LoadingIndicator = LoadingIndicatorIcon } =
    useComponentContext();
  const [thumbnailPreviewError, setThumbnailPreviewError] = useState(false);

  const { id, uploadPermissionCheck, uploadState } = attachment.localMetadata ?? {};

  const isUploading = uploadState === 'uploading';
  const handleThumbnailLoadError = useCallback(() => setThumbnailPreviewError(true), []);
  const hasSizeLimitError = uploadPermissionCheck?.reason === 'size_limit';
  const hasFatalError = uploadState === 'blocked' || hasSizeLimitError;
  const hasRetriableError = uploadState === 'failed' && !!handleRetry;
  const hasUploadError = hasRetriableError || hasFatalError;

  const retry = (e: MouseEvent<Element> | KeyboardEvent<Element>) => {
    e.stopPropagation();
    handleRetry(attachment);
    return false;
  };

  const thumbnail = useMemo(
    () =>
      isVideoAttachment(attachment)
        ? {
            alt: attachment.title,
            title: attachment.title,
            url: attachment.thumb_url,
          }
        : {
            alt: attachment.fallback,
            title: attachment.fallback,
            url: attachment.image_url || attachment.localMetadata.previewUri,
          },
    [attachment],
  );

  return (
    <AttachmentPreviewRoot
      attachment={attachment}
      className={clsx('str-chat__attachment-preview-media', {
        'str-chat__attachment-preview-media--thumbnail-preview-error':
          thumbnailPreviewError,
        'str-chat__attachment-preview-media--upload-error': hasUploadError,
        'str-chat__attachment-preview-media--uploading': isUploading,
      })}
      data-testid='attachment-preview-media'
      onPressed={hasRetriableError ? retry : undefined}
    >
      <div className='str-chat__attachment-preview-media__thumbnail-wrapper'>
        {thumbnail.url && (
          <BaseImage
            alt={thumbnail.alt}
            className='str-chat__attachment-preview-media__thumbnail'
            onError={handleThumbnailLoadError}
            src={thumbnail.url}
            title={thumbnail.title}
          />
        )}

        <div className={clsx('str-chat__attachment-preview-media__overlay')}>
          {isUploading && <LoadingIndicator />}

          {isVideoAttachment(attachment) &&
            !hasUploadError &&
            uploadState !== 'uploading' && (
              <div className='str-chat__attachment-preview-media__video-indicator'>
                <IconVideoSolid />
                {attachment.duration && <div>{attachment.duration}</div>}
              </div>
            )}

          {hasFatalError && <IconExclamationCircle />}

          {hasRetriableError && (
            <Button
              aria-label={t('aria/Retry upload')}
              className={clsx(
                'str-chat__attachment-preview-media__retry-upload-button',
                'str-chat__button--solid',
                'str-chat__button--destructive',
                'str-chat__button--size-sm',
                'str-chat__button--circular',
              )}
              data-testid='video-preview-item-retry-button'
              onClick={retry}
            >
              <IconArrowRotateClockwise />
            </Button>
          )}
        </div>
      </div>

      <RemoveAttachmentPreviewButton
        data-testid='video-preview-item-delete-button'
        onClick={() => {
          if (id) removeAttachments([id]);
        }}
        uploadState={uploadState}
      />
    </AttachmentPreviewRoot>
  );
};
