import { useCallback } from 'react';
import { useMessageComposer } from './useMessageComposer';
import { dataTransferItemsToFiles } from '../../ReactFileUtilities';

export const usePasteHandler = () => {
  const { attachmentManager, textComposer } = useMessageComposer();
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

        if (plainTextPromise) {
          const pastedText = await plainTextPromise;
          textComposer.insertText({ text: pastedText });
        } else {
          attachmentManager.uploadFiles(fileLikes);
        }
      })(clipboardEvent);
    },
    [attachmentManager, textComposer],
  );

  return { onPaste };
};
