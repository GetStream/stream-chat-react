import clsx from 'clsx';
import type { PropsWithChildren } from 'react';
import React, { useCallback, useMemo } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTranslationContext } from '../../context';

export type ImageDropzoneProps = {
  /**
   * Set accepted file types. See https://github.com/okonet/attr-accept for more information. Keep in mind that mime type determination is not reliable across platforms. CSV files, for example, are reported as text/plain under macOS but as application/vnd.ms-excel under Windows. In some cases there might not be a mime type set at all.
   *
   * One of type: `string, string[]`
   */
  accept?: string | string[];
  /** Enable/disable the dropzone */
  disabled?: boolean;
  handleFiles?: (files: FileList | File[]) => void;
  maxNumberOfFiles?: number;
  /** Allow drag 'n' drop (or selection from the file dialog) of multiple files */
  multiple?: boolean;
};

export const ImageDropzone = ({
  accept: acceptedFiles = [],
  children,
  disabled,
  handleFiles,
  maxNumberOfFiles,
  multiple,
}: PropsWithChildren<ImageDropzoneProps>) => {
  const { t } = useTranslationContext('ImageDropzone');

  const handleDrop = useCallback(
    (accepted: File[]) => {
      if (!handleFiles) {
        return;
      }

      if (accepted && accepted.length) {
        handleFiles(accepted);
      }
    },
    [handleFiles],
  );

  const accept = useMemo(
    () =>
      (typeof acceptedFiles === 'string'
        ? acceptedFiles.split(',')
        : acceptedFiles
      ).reduce<Record<string, Array<string>>>((mediaTypeMap, mediaType) => {
        mediaTypeMap[mediaType] ??= [];
        return mediaTypeMap;
      }, {}),
    [acceptedFiles],
  );

  const { getRootProps, isDragAccept, isDragReject } = useDropzone({
    accept,
    disabled,
    maxFiles: maxNumberOfFiles,
    multiple,
    noClick: true,
    onDrop: handleDrop,
  });

  return (
    <div
      {...getRootProps({
        className: clsx('rfu-dropzone', {
          'rfu-dropzone--accept': isDragAccept,
          'rfu-dropzone--reject': isDragReject,
        }),
        style: { position: 'relative' },
      })}
      tabIndex={-1}
    >
      <div className='rfu-dropzone__notifier'>
        <div className='rfu-dropzone__inner'>
          <svg
            height='41'
            viewBox='0 0 41 41'
            width='41'
            xmlns='http://www.w3.org/2000/svg'
          >
            <path
              d='M40.517 28.002V3.997c0-2.197-1.808-3.992-4.005-3.992H12.507a4.004 4.004 0 0 0-3.992 3.993v24.004a4.004 4.004 0 0 0 3.992 3.993h24.005c2.197 0 4.005-1.795 4.005-3.993zm-22.002-7.997l4.062 5.42 5.937-7.423 7.998 10H12.507l6.008-7.997zM.517 8.003V36c0 2.198 1.795 4.005 3.993 4.005h27.997V36H4.51V8.002H.517z'
              fill='#000'
              fillRule='nonzero'
            />
          </svg>
          <p>{t<string>('Drag your files here to add to your post')}</p>
        </div>
      </div>
      {children}
    </div>
  );
};
