import React from 'react';

import { FileIcon } from './FileIcon';
import { LoadingIndicator } from './LoadingIndicator';

import type { FileUpload } from './types';
import type { FileIconProps } from './FileIcon/FileIcon';

export type FilePreviewerProps = {
  fileIconProps?: FileIconProps;
  handleFiles?: (files: FileList) => void;
  handleRemove?: (id: string) => void;
  handleRetry?: (id: string) => void;
  uploads?: FileUpload[];
};

/**
 * Component that displays files which are being uploaded
 */
export const FilePreviewer = ({
  fileIconProps = {},
  uploads,
  handleRemove,
  handleRetry,
}: FilePreviewerProps) => (
  <div className='rfu-file-previewer'>
    <ol>
      {uploads?.map((upload) => (
        <li
          className={`rfu-file-previewer__file ${
            upload.state === 'uploading' ? 'rfu-file-previewer__file--uploading' : ''
          } ${upload.state === 'failed' ? 'rfu-file-previewer__file--failed' : ''}`}
          key={upload.id}
        >
          <FileIcon mimeType={upload.file.type} {...fileIconProps} />
          <a download href={upload.url}>
            {upload.file.name}
            {upload.state === 'failed' && (
              <>
                <div
                  className='rfu-file-previewer__failed'
                  onClick={() => handleRetry?.(upload.id)}
                >
                  failed
                </div>
                <div className='rfu-file-previewer__retry' onClick={() => handleRetry?.(upload.id)}>
                  retry
                </div>
              </>
            )}
          </a>

          <span
            className='rfu-file-previewer__close-button'
            onClick={handleRemove && (() => handleRemove(upload.id))}
          >
            ✘
          </span>
          {upload.state === 'uploading' && (
            <div className='rfu-file-previewer__loading-indicator'>
              <LoadingIndicator />
            </div>
          )}
        </li>
      ))}
    </ol>
  </div>
);
