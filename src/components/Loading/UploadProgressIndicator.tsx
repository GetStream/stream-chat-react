import React from 'react';

import { useComponentContext } from '../../context';
import { CircularProgressIndicator as DefaultProgressIndicator } from './progress-indicators';
import { LoadingIndicator as DefaultLoadingIndicator } from './LoadingIndicator';

export type UploadProgressIndicatorProps = {
  /**
   * Every byte has been sent, but the server has not confirmed yet — see
   * `UploadRecord.uploadConfirmationPending` in `stream-chat`. Renders the indeterminate indicator, since
   * a bar sitting at 100% would claim the upload is confirmed while it is not.
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
