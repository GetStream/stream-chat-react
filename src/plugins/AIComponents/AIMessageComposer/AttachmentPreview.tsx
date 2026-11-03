import {
  type ComponentPropsWithoutRef,
  type MouseEvent,
  useEffect,
  useState,
} from 'react';
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
  const fileName = title || file.name || t('Unknown file name');
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
        aria-label={t('Delete attachment')}
        className='str-chat__ai-attachment-preview__delete-button'
        onClick={onDelete}
        type='button'
      >
        <IconXmark />
      </button>

      {state === 'failed' && (
        <div className='str-chat__ai-attachment-preview__failed-state-overlay'>
          <button
            aria-label={t('aria/Retry upload')}
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

type Attachments = ReturnType<typeof useAttachments>;

// An object URL per picked image, revoked once it is removed or the preview unmounts.
const useImagePreviewSources = (attachments: Attachments['attachments']) => {
  const [sources, setSources] = useState<Record<string, string>>({});
  useEffect(() => {
    if (typeof URL.createObjectURL !== 'function') return;
    const created: Record<string, string> = {};
    for (const { file, id } of attachments) {
      if (file.type.startsWith('image/')) created[id] = URL.createObjectURL(file);
    }
    setSources(created);
    return () => Object.values(created).forEach((url) => URL.revokeObjectURL(url));
  }, [attachments]);
  return sources;
};

const DefaultItems = ({ attachments, removeAttachment }: Attachments) => {
  const sources = useImagePreviewSources(attachments);
  return (
    <>
      {attachments.map(({ file, id, meta }) => (
        <Item
          file={file}
          imagePreviewSource={
            typeof meta?.previewUri === 'string' ? meta.previewUri : sources[id]
          }
          key={id}
          onDelete={() => removeAttachment(id)}
          state={typeof meta?.state === 'string' ? meta.state : undefined}
        />
      ))}
    </>
  );
};

/**
 * The attachments picked in the composer. Its children render them: elements, or a function of
 * `useAttachments()`. Without children it shows an `Item` per picked attachment, each with a
 * delete button (an attachment's `meta.state` and `meta.previewUri` are used when set), and
 * nothing while none are picked.
 */
export const AttachmentPreview = ({
  children,
  className,
  ...restProps
}: Omit<ComponentPropsWithoutRef<'div'>, 'children'> & {
  children?: React.ReactNode | ((_: Attachments) => React.ReactNode);
}) => {
  const attachments = useAttachments();

  if (!children && attachments.attachments.length === 0) {
    return null;
  }

  return (
    <div className={clsx('str-chat__ai-attachment-preview', className)} {...restProps}>
      {typeof children === 'function'
        ? children(attachments)
        : (children ?? <DefaultItems {...attachments} />)}
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
