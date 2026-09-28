import type { MessageComposer, TextComposerMiddleware } from 'stream-chat';
import {
  createActiveCommandGuardMiddleware,
  createCommandInjectionMiddleware,
  createCommandStringExtractionMiddleware,
  createDraftCommandInjectionMiddleware,
} from 'stream-chat';

// A command picked in the composer (e.g. /giphy) is shown as a chip, with the command taken out of
// the text. These middlewares keep it that way: they move a typed command into the chip and stop
// command suggestions while one is active, and put the command back in front of the text when the
// message is sent or saved as a draft - without that, `/giphy cats` goes out as plain `cats`.
export const setUpCommandMiddlewares = (composer: MessageComposer) => {
  composer.compositionMiddlewareExecutor.insert({
    middleware: [createCommandInjectionMiddleware(composer)],
    position: { after: 'stream-io/message-composer-middleware/attachments' },
    unique: true,
  });
  composer.draftCompositionMiddlewareExecutor.insert({
    middleware: [createDraftCommandInjectionMiddleware(composer)],
    position: { after: 'stream-io/message-composer-middleware/draft-attachments' },
    unique: true,
  });
  composer.textComposer.middlewareExecutor.insert({
    middleware: [createActiveCommandGuardMiddleware() as TextComposerMiddleware],
    position: { before: 'stream-io/text-composer/commands-middleware' },
    unique: true,
  });
  composer.textComposer.middlewareExecutor.insert({
    middleware: [createCommandStringExtractionMiddleware() as TextComposerMiddleware],
    position: { after: 'stream-io/text-composer/commands-middleware' },
    unique: true,
  });
};
