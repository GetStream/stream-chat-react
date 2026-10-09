import { type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { useAttachments } from './ai-message-composer';
import clsx from 'clsx';

const byteValueNumberFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

export const Item = ({
  file,
  onDelete,
  onRetry,
  state,
  title,
  imagePreviewSource,
}: {
  file: File;
  state?: 'uploading' | 'finished' | 'failed' | 'pending' | (string & {});
  title?: string;
  imagePreviewSource?: string;
  onDelete?: (_: MouseEvent<HTMLButtonElement>) => void;
  onRetry?: (_: MouseEvent<HTMLButtonElement>) => void;
}) => {
  const fileName = title || file.name || 'Unknown file name';
  const readableFileSize = byteValueNumberFormatter.format(file.size);
  const isImage = file.type.startsWith('image/');

  return (
    <div
      className={clsx('aicr__attachment-preview__item', {
        'aicr__attachment-preview__item--uploading': state === 'uploading',
        'aicr__attachment-preview__item--uploaded': state === 'uploaded',
        'aicr__attachment-preview__item--failed': state === 'failed',
        'aicr__attachment-preview__item--pending': state === 'pending',
      })}
    >
      <button
        className="aicr__attachment-preview__delete-button"
        type="button"
        aria-label="Delete attachment"
        onClick={onDelete}
      >
        <span className="material-symbols-rounded">close</span>
      </button>

      {state === 'failed' && (
        <div className="aicr__attachment-preview__failed-state-overlay">
          <button
            onClick={onRetry}
            className="aicr__attachment-preview__retry-button"
            type="button"
            aria-label="Upload failed"
          >
            <span className="material-symbols-rounded">refresh</span>
          </button>
        </div>
      )}

      {!isImage && (
        <div className="aicr__attachment-preview__item-content">
          <span
            style={{ fontSize: '2rem' }}
            className="material-symbols-rounded"
          >
            description
          </span>
          <div className="aicr__attachment-preview__file-metadata">
            <div
              title={fileName}
              className="aicr__attachment-preview__file-name"
            >
              {fileName}
            </div>
            <div className="aicr__attachment-preview__file-size">
              {readableFileSize}
            </div>
          </div>
        </div>
      )}
      {isImage && (
        <img
          className="aicr__attachment-preview__image"
          src={imagePreviewSource}
          alt={fileName}
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
    <div className="aicr__attachment-preview" {...restProps}>
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
