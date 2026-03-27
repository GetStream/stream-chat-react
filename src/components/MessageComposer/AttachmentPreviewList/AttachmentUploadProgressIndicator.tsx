import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import { ProgressIndicator as DefaultProgressIndicator } from '../../Loading';
import { useComponentContext } from '../../../context';
import { LoadingIndicatorIcon } from '../icons';

export type AttachmentUploadProgressVariant = 'inline' | 'overlay';

export type AttachmentUploadProgressIndicatorProps = {
  className?: string;
  /** Shown when `uploadProgress` is `undefined` (e.g. progress tracking disabled). */
  fallback?: ReactNode;
  uploadProgress?: number;
  variant: AttachmentUploadProgressVariant;
};

export const AttachmentUploadProgressIndicator = ({
  className,
  fallback,
  uploadProgress,
  variant,
}: AttachmentUploadProgressIndicatorProps) => {
  const { ProgressIndicator = DefaultProgressIndicator } = useComponentContext(
    'AttachmentUploadProgressIndicator',
  );

  if (uploadProgress === undefined) {
    return <>{fallback ?? <LoadingIndicatorIcon />}</>;
  }

  return (
    <div
      className={clsx(
        'str-chat__attachment-upload-progress',
        `str-chat__attachment-upload-progress--${variant}`,
        className,
      )}
    >
      <ProgressIndicator percent={uploadProgress} />
    </div>
  );
};
