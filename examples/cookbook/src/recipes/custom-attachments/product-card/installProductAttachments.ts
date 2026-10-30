import type { StreamChat } from 'stream-chat';
import {
  createDraftProductAttachmentsMiddleware,
  createProductAttachmentsMiddleware,
  DRAFT_PRODUCT_ATTACHMENTS_MIDDLEWARE_ID,
  PRODUCT_ATTACHMENTS_MIDDLEWARE_ID,
} from './productAttachmentsMiddleware';

/** Adds the product middleware to every composer; returns a function that stops it. */
export const installProductAttachments = (client: StreamChat) => {
  client.config.setSetupFunction('messageComposer', ({ composer }) => {
    composer.compositionMiddlewareExecutor.insert({
      middleware: [createProductAttachmentsMiddleware(composer)],
      position: { after: 'stream-io/message-composer-middleware/attachments' },
      unique: true,
    });
    composer.draftCompositionMiddlewareExecutor.insert({
      middleware: [createDraftProductAttachmentsMiddleware(composer)],
      position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
      unique: true,
    });

    return () => {
      composer.compositionMiddlewareExecutor.remove(PRODUCT_ATTACHMENTS_MIDDLEWARE_ID);
      composer.draftCompositionMiddlewareExecutor.remove(
        DRAFT_PRODUCT_ATTACHMENTS_MIDDLEWARE_ID,
      );
    };
  });

  return () => client.config.setSetupFunction('messageComposer', null);
};
