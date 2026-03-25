import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import { useComponentContext } from '../../../context';
import { UploadProgress as DefaultUploadProgress, LoadingIndicatorIcon } from '../icons';
import { clampUploadPercent } from './utils/uploadProgress';

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
  const { UploadProgress = DefaultUploadProgress } = useComponentContext(
    'AttachmentUploadProgressIndicator',
  );

  if (uploadProgress === undefined) {
    return <>{fallback ?? <LoadingIndicatorIcon />}</>;
  }

  const percent = Math.round(clampUploadPercent(uploadProgress));

  return (
    <div
      className={clsx(
        'str-chat__attachment-upload-progress',
        `str-chat__attachment-upload-progress--${variant}`,
        className,
      )}
    >
      <UploadProgress percent={percent} />
    </div>
  );
};
