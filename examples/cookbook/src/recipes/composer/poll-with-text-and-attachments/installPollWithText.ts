import type { StreamChat } from 'stream-chat';

const POLL_ONLY_MIDDLEWARE_ID = 'stream-io/message-composer-middleware/poll-only';
const USER_DATA_INJECTION_MIDDLEWARE_ID =
  'stream-io/message-composer-middleware/user-data-injection';

/** Sends a poll with the text and attachments of its message. Returns a function that stops it. */
export const installPollWithText = (client: StreamChat) => {
  client.config.setSetupFunction('messageComposer', ({ composer }) => {
    const executor = composer.compositionMiddlewareExecutor;
    const pollOnly = executor.installedMiddleware.find(
      ({ id }) => id === POLL_ONLY_MIDDLEWARE_ID,
    );
    const { retainCompositionOnSubmit } = composer.config;

    executor.remove(POLL_ONLY_MIDDLEWARE_ID);
    // The SDK keeps the composer's content after sending a poll, because its poll message leaves
    // the rest out. Here everything goes out with the poll, so the composer empties as for any
    // message.
    composer.updateConfig({ retainCompositionOnSubmit: () => false });

    return () => {
      if (pollOnly) {
        executor.insert({
          middleware: [pollOnly],
          position: { after: USER_DATA_INJECTION_MIDDLEWARE_ID },
          unique: true,
        });
      }
      composer.updateConfig({ retainCompositionOnSubmit });
    };
  });

  return () => client.config.setSetupFunction('messageComposer', null);
};
