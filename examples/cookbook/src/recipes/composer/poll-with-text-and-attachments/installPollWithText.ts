import type { StreamChat } from 'stream-chat';
import {
  createPollOnlyCompositionMiddleware,
  POLL_ONLY_COMPOSITION_MIDDLEWARE_ID,
} from 'stream-chat';

const USER_DATA_INJECTION_MIDDLEWARE_ID =
  'stream-io/message-composer-middleware/user-data-injection';

/** Sends a poll with the text and attachments of its message. Returns a function that stops it. */
export const installPollWithText = (client: StreamChat) => {
  client.config.setSetupFunction('messageComposer', ({ composer }) => {
    const executor = composer.compositionMiddlewareExecutor;

    // Without the poll-only step, the message keeps its text and attachments, and the composer
    // empties after the send, as for any message.
    executor.remove(POLL_ONLY_COMPOSITION_MIDDLEWARE_ID);

    return () => {
      executor.insert({
        middleware: [createPollOnlyCompositionMiddleware(composer)],
        position: { after: USER_DATA_INJECTION_MIDDLEWARE_ID },
        unique: true,
      });
    };
  });

  return () => client.config.setSetupFunction('messageComposer', null);
};
