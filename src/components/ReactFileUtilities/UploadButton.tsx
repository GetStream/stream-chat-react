import clsx from 'clsx';
import { nanoid } from 'nanoid';
import type { ComponentProps } from 'react';
import React, { forwardRef, useCallback, useMemo } from 'react';

import { useHandleFileChangeWrapper } from './utils';
import { useChannelStateContext, useTranslationContext } from '../../context';
import type { PartialSelected } from '../../types/types';
import { useMessageComposer } from '../MessageInput/hooks/messageComposer/useMessageComposer';
import { useIsUploadEnabled } from '../MessageInput/hooks/messageComposer/useIsUploadEnabled';

/**
 * @deprecated Use FileInputProps instead.
 */
export type UploadButtonProps = {
  onFileChange: (files: Array<File>) => void;
  resetOnChange?: boolean;
} & Omit<ComponentProps<'input'>, 'type' | 'onChange'>;

/**
 * @deprecated Use FileInput instead
 */

export const UploadButton = forwardRef(function UploadButton(
  { onFileChange, resetOnChange = true, ...rest }: UploadButtonProps,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const handleInputChange = useHandleFileChangeWrapper(resetOnChange, onFileChange);

  return <input onChange={handleInputChange} ref={ref} type='file' {...rest} />;
});

export type FileInputProps = UploadButtonProps;

export const FileInput = UploadButton;

export const UploadFileInput = forwardRef(function UploadFileInput(
  {
    className,
    onFileChange: onFileChangeCustom,
    ...props
  }: PartialSelected<FileInputProps, 'onFileChange'>,
  ref: React.ForwardedRef<HTMLInputElement>,
) {
  const { t } = useTranslationContext('UploadFileInput');
  const { acceptedFiles = [] } = useChannelStateContext('UploadFileInput');
  const messageComposer = useMessageComposer();
  const { isUploadEnabled } = useIsUploadEnabled();
  const id = useMemo(() => nanoid(), []);

  const onFileChange = useCallback(
    (files: Array<File>) => {
      messageComposer.attachmentManager.uploadFiles(files);
      onFileChangeCustom?.(files);
    },
    [onFileChangeCustom, messageComposer],
  );

  return (
    <FileInput
      accept={acceptedFiles?.join(',')}
      aria-label={t('aria/File upload')}
      data-testid='file-input'
      disabled={!isUploadEnabled} // todo: check whether cooldownremaining is also necessary
      id={id}
      multiple={messageComposer.attachmentManager.maxNumberOfFilesPerMessage > 1}
      {...props}
      className={clsx('str-chat__file-input', className)}
      onFileChange={onFileChange}
      ref={ref}
    />
  );
});
