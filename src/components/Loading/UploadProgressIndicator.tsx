import React from 'react';

import { useComponentContext } from '../../context';
import { CircularProgressIndicator as DefaultProgressIndicator } from './progress-indicators';
import { LoadingIndicator as DefaultLoadingIndicator } from './LoadingIndicator';

export type UploadProgressIndicatorProps = {
  /**
   * Every byte is sent but the server has not confirmed yet
   * (`UploadRecord.uploadConfirmationPending` in `stream-chat`). Shows the loading indicator,
   * since a full ring would imply a confirmed upload.
   */
  uploadConfirmationPending?: boolean;
  uploadProgress?: number;
};

export const UploadProgressIndicator = ({
  uploadConfirmationPending,
  uploadProgress,
}: UploadProgressIndicatorProps) => {
  const {
    LoadingIndicator = DefaultLoadingIndicator,
    ProgressIndicator = DefaultProgressIndicator,
  } = useComponentContext();

  if (uploadConfirmationPending || uploadProgress === undefined) {
    return <LoadingIndicator data-testid='loading-indicator' />;
  }

  return <ProgressIndicator percent={uploadProgress} />;
};
