import { useCallback } from 'react';
import {
  // dataTransferItemsHaveFiles,
  dataTransferItemsToFiles,
  FileLike,
} from '../../ReactFileUtilities';
import type { EnrichURLsController } from './useLinkPreviews';
import { SetLinkPreviewMode } from '../types';

export const usePasteHandler = (
  uploadNewFiles: (files: FileList | FileLike[] | File[]) => void,
  insertText: (textToInsert: string) => void,
  isUploadEnabled: boolean,
  findAndEnqueueURLsToEnrich?: EnrichURLsController['findAndEnqueueURLsToEnrich'],
) => {
  const onPaste = useCallback(
    (clipboardEvent: React.ClipboardEvent<HTMLTextAreaElement>) => {
      (async (event) => {
        const { items } = event.clipboardData;
        event.preventDefault();
        // Get a promise for the plain text in case no files are
        // found. This needs to be done here because chrome cleans
        // up the DataTransferItems after resolving of a promise.
        let plainTextPromise: Promise<string> | undefined = undefined;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'string' && item.type === 'text/plain') {
            plainTextPromise = new Promise((resolve) => {
              item.getAsString((string) => {
                resolve(string);
              });
            });
            break;
          }
        }

        const fileLikes = await dataTransferItemsToFiles(Array.from(items));
        if (fileLikes.length && isUploadEnabled) {
          uploadNewFiles(fileLikes);
          return;
        }

        // fallback to regular text paste
        if (plainTextPromise) {
          const pastedText = await plainTextPromise;
          insertText(pastedText);
          findAndEnqueueURLsToEnrich?.(pastedText, SetLinkPreviewMode.UPSERT);
          findAndEnqueueURLsToEnrich?.flush();
        }
      })(clipboardEvent);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [insertText, uploadNewFiles],
  );

  return { onPaste };
};
