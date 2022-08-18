import { useMemo } from 'react';

import type { FileUpload } from './useMessageInputState';

export const useFileState = <T extends Pick<FileUpload, 'state'>>(file: T) =>
  useMemo(
    () => ({
      failed: file.state === 'failed',
      finished: file.state === 'finished',
      uploading: file.state === 'uploading',
    }),
    [file.state],
  );
