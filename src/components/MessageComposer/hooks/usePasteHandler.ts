import { useCallback } from 'react';
import { useMessageComposerController } from './useMessageComposerController';
import { dataTransferItemsToFiles } from '../../ReactFileUtilities';

export const usePasteHandler = () => {
  const { attachmentManager, textComposer } = useMessageComposerController();
  const onPaste = useCallback(
    (clipboardEvent: React.ClipboardEvent<HTMLTextAreaElement>) => {
      (async (event) => {
        const { items } = event.clipboardData;
        event.preventDefault();
        // Start reading the plain text (inserted instead of uploading files) before awaiting:
        // Chrome clears the DataTransferItems once a promise resolves.
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
