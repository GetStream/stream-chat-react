import clsx from 'clsx';
import React, { type ReactNode } from 'react';

import { CircularProgressIndicator as DefaultCircularProgressIndicator } from '../../Loading';
import { useComponentContext } from '../../../context';
import { LoadingIndicatorIcon } from '../icons';

export type AttachmentUploadProgressIndicatorProps = {
  className?: string;
  /** Shown when `uploadProgress` is `undefined` (e.g. progress tracking disabled). */
  fallback?: ReactNode;
  uploadProgress?: number;
};

export const AttachmentUploadProgressIndicator = ({
  className,
  fallback,
  uploadProgress,
}: AttachmentUploadProgressIndicatorProps) => {
  const { CircularProgressIndicator = DefaultCircularProgressIndicator } =
    useComponentContext();

  if (uploadProgress === undefined) {
    return <>{fallback ?? <LoadingIndicatorIcon data-testid='loading-indicator' />}</>;
  }

  return (
    <div className={clsx('str-chat__attachment-upload-progress', className)}>
      <CircularProgressIndicator percent={uploadProgress} />
    </div>
  );
};
