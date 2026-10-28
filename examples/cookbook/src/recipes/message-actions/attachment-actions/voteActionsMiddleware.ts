import { isImageAttachment } from 'stream-chat';
import type {
  Attachment,
  MessageComposerMiddlewareState,
  MessageCompositionMiddleware,
  MiddlewareHandlerParams,
} from 'stream-chat';
import { voteActions } from './voteActions';

const addVoteActions = (attachments: Attachment[] = []) =>
  attachments.map((attachment) =>
    isImageAttachment(attachment) ? { ...attachment, actions: voteActions } : attachment,
  );

export const voteActionsMiddleware: MessageCompositionMiddleware = {
  id: 'my-app/vote-actions',
  handlers: {
    compose: ({
      forward,
      next,
      state,
    }: MiddlewareHandlerParams<MessageComposerMiddlewareState>) => {
      if (!state.message.attachments?.some(isImageAttachment)) return forward();

      return next({
        ...state,
        localMessage: {
          ...state.localMessage,
          attachments: addVoteActions(state.localMessage.attachments),
        },
        message: {
          ...state.message,
          attachments: addVoteActions(state.message.attachments),
        },
      });
    },
  },
};
