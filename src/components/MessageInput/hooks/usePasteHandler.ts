import { useCallback } from 'react';
import { dataTransferItemsHaveFiles, dataTransferItemsToFiles, FileLike } from 'react-file-utils';

export const usePasteHandler = (
  uploadNewFiles: (files: FileList | FileLike[] | File[]) => void,
  insertText: (textToInsert: string) => void,
  isUploadEnabled: boolean,
) => {
  const onPaste = useCallback(
    (clipboardEvent: React.ClipboardEvent<HTMLTextAreaElement>) => {
      if (!isUploadEnabled) return;
      (async (event) => {
        // TODO: Move this handler to package with ImageDropzone
        const { items } = event.clipboardData;
        if (!dataTransferItemsHaveFiles(Array.from(items))) return;

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
        if (fileLikes.length) {
          uploadNewFiles(fileLikes);
          return;
        }

        // fallback to regular text paste
        if (plainTextPromise) {
          const pastedText = await plainTextPromise;
          insertText(pastedText);
        }
      })(clipboardEvent);
    },
    [insertText, uploadNewFiles],
  );

  return { onPaste };
};
