import type { StreamChat } from 'stream-chat';
import { voteActionsMiddleware } from './voteActionsMiddleware';

/** Adds the vote actions to every composer's images; returns a function that stops it. */
export const installVoteActions = (client: StreamChat) => {
  client.config.setSetupFunction('messageComposer', ({ composer }) => {
    composer.compositionMiddlewareExecutor.insert({
      middleware: [voteActionsMiddleware],
      position: { after: 'stream-io/message-composer-middleware/attachments' },
      unique: true,
    });

    return () => composer.compositionMiddlewareExecutor.remove(voteActionsMiddleware.id);
  });

  return () => client.config.setSetupFunction('messageComposer', null);
};
