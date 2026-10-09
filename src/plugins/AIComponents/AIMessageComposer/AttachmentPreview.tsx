import { type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { useAttachments } from './AIMessageComposer';
import clsx from 'clsx';
import { useComponentContextIcons } from '../../../context/useComponentContextIcons';
import { useTranslationContext } from '../../../context/TranslationContext';

const byteValueNumberFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

export const Item = ({
  file,
  imagePreviewSource,
  onDelete,
  onRetry,
  state,
  title,
}: {
  file: File;
  state?: 'uploading' | 'finished' | 'failed' | 'pending' | (string & {});
  title?: string;
  imagePreviewSource?: string;
  onDelete?: (_: MouseEvent<HTMLButtonElement>) => void;
  onRetry?: (_: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const { t } = useTranslationContext();
  const { IconFile, IconRetry, IconXmark } = useComponentContextIcons();
  const fileName =
    title ||
    file.name ||
    t('aiComponents.attachmentPreview.unknownFileName.text', 'Unknown file name');
  const readableFileSize = byteValueNumberFormatter.format(file.size);
  const isImage = file.type.startsWith('image/');

  return (
    <div
      className={clsx('str-chat__ai-attachment-preview__item', {
        'str-chat__ai-attachment-preview__item--failed': state === 'failed',
        'str-chat__ai-attachment-preview__item--pending': state === 'pending',
        'str-chat__ai-attachment-preview__item--uploaded': state === 'uploaded',
        'str-chat__ai-attachment-preview__item--uploading': state === 'uploading',
      })}
    >
      <button
        aria-label={t(
          'aiComponents.attachmentPreview.deleteAttachment.ariaLabel',
          'Delete attachment',
        )}
        className='str-chat__ai-attachment-preview__delete-button'
        onClick={onDelete}
        type='button'
      >
        <IconXmark />
      </button>

      {state === 'failed' && (
        <div className='str-chat__ai-attachment-preview__failed-state-overlay'>
          <button
            aria-label={t('common.retryUpload.ariaLabel', 'Retry upload')}
            className='str-chat__ai-attachment-preview__retry-button'
            onClick={onRetry}
            type='button'
          >
            <IconRetry />
          </button>
        </div>
      )}

      {!isImage && (
        <div className='str-chat__ai-attachment-preview__item-content'>
          <IconFile />
          <div className='str-chat__ai-attachment-preview__file-metadata'>
            <div className='str-chat__ai-attachment-preview__file-name' title={fileName}>
              {fileName}
            </div>
            <div className='str-chat__ai-attachment-preview__file-size'>
              {readableFileSize}
            </div>
          </div>
        </div>
      )}
      {isImage && (
        <img
          alt={fileName}
          className='str-chat__ai-attachment-preview__image'
          src={imagePreviewSource}
        />
      )}
    </div>
  );
};

export const AttachmentPreview = ({
  children,
  ...restProps
}: ComponentPropsWithoutRef<'div'> & {
  children?:
    | React.ReactNode
    | ((_: ReturnType<typeof useAttachments>) => React.ReactNode);
}) => {
  const _ = useAttachments();

  if (!children) {
    return null;
  }

  return (
    <div className='str-chat__ai-attachment-preview' {...restProps}>
      {typeof children === 'function' ? children(_) : children}
    </div>
  );
};

AttachmentPreview.Item = Item;

export const chunk = <T extends unknown[]>(array: T, size: number) => {
  const chunkCount = Math.ceil(array.length / size);

  return Array.from(
    { length: chunkCount },
    (_, index) => array.slice(size * index, size * index + size) as T,
  );
};
