import clsx from 'clsx';
import { nanoid } from 'nanoid';
import type { ComponentProps } from 'react';
import React, { forwardRef, useCallback, useMemo } from 'react';

import { useHandleFileChangeWrapper } from './utils';
import { useMessageInputContext, useTranslationContext } from '../../context';
import { useMessageComposer } from '../MessageInput';
import { useAttachmentManagerState } from '../MessageInput/hooks/useAttachmentManagerState';
import { useStateStore } from '../../store';
import type { MessageComposerConfig } from 'stream-chat';
import type { PartialSelected } from '../../types/types';

const attachmentManagerConfigStateSelector = (state: MessageComposerConfig) => ({
  acceptedFiles: state.attachments.acceptedFiles,
  maxNumberOfFilesPerMessage: state.attachments.maxNumberOfFilesPerMessage,
});

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
  const { cooldownRemaining, textareaRef } = useMessageInputContext();
  const messageComposer = useMessageComposer();
  const { attachmentManager } = messageComposer;
  const { isUploadEnabled } = useAttachmentManagerState();
  const { acceptedFiles, maxNumberOfFilesPerMessage } = useStateStore(
    messageComposer.configState,
    attachmentManagerConfigStateSelector,
  );
  const id = useMemo(() => nanoid(), []);

  const onFileChange = useCallback(
    (files: Array<File>) => {
      attachmentManager.uploadFiles(files);
      textareaRef.current?.focus();
      onFileChangeCustom?.(files);
    },
    [onFileChangeCustom, attachmentManager, textareaRef],
  );

  return (
    <FileInput
      accept={acceptedFiles?.join(',')}
      aria-label={t('aria/File upload')}
      data-testid='file-input'
      disabled={!isUploadEnabled || !!cooldownRemaining}
      id={id}
      multiple={maxNumberOfFilesPerMessage > 1}
      {...props}
      className={clsx('str-chat__file-input', className)}
      onFileChange={onFileChange}
      ref={ref}
    />
  );
});
