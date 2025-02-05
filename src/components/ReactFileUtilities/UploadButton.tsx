import clsx from 'clsx';
import { nanoid } from 'nanoid';
import React, { ComponentProps, forwardRef, useCallback, useMemo } from 'react';

import { useHandleFileChangeWrapper } from './utils';
import {
  useChannelStateContext,
  useMessageInputContext,
  useTranslationContext,
} from '../../context';

import { PartialSelected } from '../../types/types';

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
  const { acceptedFiles = [], multipleUploads } =
    useChannelStateContext('UploadFileInput');
  const { isUploadEnabled, maxFilesLeft, uploadNewFiles } =
    useMessageInputContext('UploadFileInput');
  const id = useMemo(() => nanoid(), []);

  const onFileChange = useCallback(
    (files: Array<File>) => {
      uploadNewFiles(files);
      onFileChangeCustom?.(files);
    },
    [onFileChangeCustom, uploadNewFiles],
  );

  return (
    <FileInput
      accept={acceptedFiles?.join(',')}
      aria-label={t('aria/File upload')}
      data-testid='file-input'
      disabled={!isUploadEnabled || maxFilesLeft === 0}
      id={id}
      multiple={multipleUploads}
      {...props}
      className={clsx('str-chat__file-input', className)}
      onFileChange={onFileChange}
      ref={ref}
    />
  );
});
