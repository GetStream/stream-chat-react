import clsx from 'clsx';
import React from 'react';

import { useComponentContext } from '../../context';
import { CircularProgressIndicator as DefaultProgressIndicator } from './progress-indicators';
import { LoadingIndicator as DefaultLoadingIndicator } from './LoadingIndicator';

export type UploadProgressIndicatorProps = {
  uploadProgress?: number;
};

export const UploadProgressIndicator = ({
  uploadProgress,
}: UploadProgressIndicatorProps) => {
  const {
    LoadingIndicator = DefaultLoadingIndicator,
    ProgressIndicator = DefaultProgressIndicator,
  } = useComponentContext();

  if (uploadProgress === undefined) {
    return <LoadingIndicator data-testid='loading-indicator' />;
  }

  return (
    <div className={clsx('str-chat__attachment-upload-progress')}>
      <ProgressIndicator percent={uploadProgress} />
    </div>
  );
};
