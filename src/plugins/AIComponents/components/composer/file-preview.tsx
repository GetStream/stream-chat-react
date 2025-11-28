import {
  useEffect,
  useState,
  type ComponentPropsWithoutRef,
  type CSSProperties,
  type ElementType,
  type PropsWithChildren,
} from 'react';
import {
  useAttachments,
  type AIMessageComposerStore,
} from './ai-message-composer';
import clsx from 'clsx';

const FilePreviewItem = <T extends ElementType = 'div'>({
  children,
  file,
  component: Component = 'div',
}: PropsWithChildren<{
  file: AIMessageComposerStore['attachments'][number];
  component?: ElementType;
}> &
  (ComponentPropsWithoutRef<T> extends {
    style?: CSSProperties;
    className?: string;
  }
    ? ComponentPropsWithoutRef<T>
    : never)) => {
  const [[localSource, localSourceFile], setLocalSource] = useState<
    [string, File]
  >([URL.createObjectURL(file.file), file.file]);

  useEffect(() => {
    if (localSourceFile === file.file)
      return () => {
        URL.revokeObjectURL(localSource);
      };

    const newLocalSource = URL.createObjectURL(file.file);
    setLocalSource([newLocalSource, file.file]);
  }, [file.file, localSource, localSourceFile]);

  return (
    <Component
      className={clsx('aicr__file-preview__item', {
        'aicr__file-preview__item--image': file.file.type.startsWith('image/'),
        'aicr__file-preview__item--file': !file.file.type.startsWith('image/'),
        'aicr__file-preview__item--uploading': file.state === 'uploading',
        'aicr__file-preview__item--uploaded': file.state === 'uploaded',
        'aicr__file-preview__item--failed': file.state === 'failed',
      })}
      style={{ '--background-image': `url("${localSource}")` }}
    >
      {children}
    </Component>
  );
};

const byteValueNumberFormatter = Intl.NumberFormat('en', {
  notation: 'compact',
  style: 'unit',
  unit: 'byte',
  unitDisplay: 'narrow',
});

export const FilePreview = () => {
  const { attachments, removeAttachment } = useAttachments();

  const filesToUpload = attachments.filter(
    (attachment) => attachment.state === 'pending',
  );

  if (attachments.length === 0) return null;

  return (
    <div className="aicr__file-preview">
      {attachments.map((attachment) => {
        const isImage = attachment.file.type.startsWith('image/');
        const fileName = attachment.file.name ?? 'File';
        const readableFileSize =
          typeof attachment.file.size === 'number'
            ? byteValueNumberFormatter.format(attachment.file.size)
            : 'Unknown size';

        return (
          <FilePreviewItem file={attachment} key={attachment.id}>
            <button
              className="aicr__file-preview__delete-button"
              type="button"
              onClick={() => removeAttachment(attachment.file)}
              aria-label="Delete file"
            >
              <span className="material-symbols-rounded">close</span>
            </button>

            {!isImage && (
              <div className="aicr__file-preview__item-content">
                <span
                  style={{ fontSize: '2rem' }}
                  className="material-symbols-rounded"
                >
                  description
                </span>
                <div className="aicr__file-preview__file-metadata">
                  <div
                    title={fileName}
                    className="aicr__file-preview__file-name"
                  >
                    {fileName}
                  </div>
                  <div className="aicr__file-preview__file-size">
                    {readableFileSize}
                  </div>
                </div>
              </div>
            )}
          </FilePreviewItem>
        );
      })}
    </div>
  );
};
