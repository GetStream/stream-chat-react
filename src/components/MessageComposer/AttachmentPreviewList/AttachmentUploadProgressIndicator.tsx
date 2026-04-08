import clsx from 'clsx';
import React from 'react';

import {
  CircularProgressIndicator as DefaultCircularProgressIndicator,
  LoadingIndicator as DefaultLoadingIndicator,
} from '../../Loading';
import { useComponentContext } from '../../../context';

export type AttachmentUploadProgressIndicatorProps = {
  className?: string;
  uploadProgress?: number;
};

export const AttachmentUploadProgressIndicator = ({
  className,
  uploadProgress,
}: AttachmentUploadProgressIndicatorProps) => {
  const {
    CircularProgressIndicator = DefaultCircularProgressIndicator,
    LoadingIndicator = DefaultLoadingIndicator,
  } = useComponentContext();

  if (uploadProgress === undefined) {
    return <LoadingIndicator data-testid='loading-indicator' />;
  }

  return (
    <div className={clsx('str-chat__attachment-upload-progress', className)}>
      <CircularProgressIndicator percent={uploadProgress} />
    </div>
  );
};
