import { type ComponentPropsWithoutRef, type MouseEvent } from 'react';
import { useAttachments } from './AIMessageComposer';
import clsx from 'clsx';

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
  const fileName = title || file.name || 'Unknown file name';
  const readableFileSize = byteValueNumberFormatter.format(file.size);
  const isImage = file.type.startsWith('image/');

  return (
    <div
      className={clsx('aicr__attachment-preview__item', {
        'aicr__attachment-preview__item--failed': state === 'failed',
        'aicr__attachment-preview__item--pending': state === 'pending',
        'aicr__attachment-preview__item--uploaded': state === 'uploaded',
        'aicr__attachment-preview__item--uploading': state === 'uploading',
      })}
    >
      <button
        aria-label='Delete attachment'
        className='aicr__attachment-preview__delete-button'
        onClick={onDelete}
        type='button'
      >
        <span className='material-symbols-rounded'>close</span>
      </button>

      {state === 'failed' && (
        <div className='aicr__attachment-preview__failed-state-overlay'>
          <button
            aria-label='Upload failed'
            className='aicr__attachment-preview__retry-button'
            onClick={onRetry}
            type='button'
          >
            <span className='material-symbols-rounded'>refresh</span>
          </button>
        </div>
      )}

      {!isImage && (
        <div className='aicr__attachment-preview__item-content'>
          <span className='material-symbols-rounded' style={{ fontSize: '2rem' }}>
            description
          </span>
          <div className='aicr__attachment-preview__file-metadata'>
            <div className='aicr__attachment-preview__file-name' title={fileName}>
              {fileName}
            </div>
            <div className='aicr__attachment-preview__file-size'>{readableFileSize}</div>
          </div>
        </div>
      )}
      {isImage && (
        <img
          alt={fileName}
          className='aicr__attachment-preview__image'
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
    <div className='aicr__attachment-preview' {...restProps}>
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
