import { useTranslationContext } from '../../../context/TranslationContext';
import { useMessageComposer } from '..';
import { useChannelStateContext, useThreadContext } from '../../..';
import { MessageComposer } from 'stream-chat';
import { useStableCallback } from '../../../utils/useStableCallback';

const takeStateSnapshot = (messageComposer: MessageComposer) => {
  const textComposerState = messageComposer.textComposer.state.getLatestValue();
  const attachmentManagerState = messageComposer.attachmentManager.state.getLatestValue();
  const linkPreviewsManagerState =
    messageComposer.linkPreviewsManager.state.getLatestValue();
  const pollComposerState = messageComposer.pollComposer.state.getLatestValue();
  const customDataManagerState = messageComposer.customDataManager.state.getLatestValue();
  const state = messageComposer.state.getLatestValue();
  const locationComposerState = messageComposer.locationComposer.state.getLatestValue();

  return () => {
    messageComposer.state.next(state);
    messageComposer.textComposer.state.next(textComposerState);
    messageComposer.attachmentManager.state.next(attachmentManagerState);
    messageComposer.linkPreviewsManager.state.next(linkPreviewsManagerState);
    messageComposer.pollComposer.state.next(pollComposerState);
    messageComposer.locationComposer.state.next(locationComposerState);
    messageComposer.customDataManager.state.next(customDataManagerState);
  };
};

export const useSendMessageFn = () => {
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const messageComposer = useMessageComposer();
  const { t } = useTranslationContext('useSendMessageFn');

  return useStableCallback(
    async () => {
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;
      const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
      try {
        /**
         * When sending a message with poll, no text, attachments, etc. are allowed,
         * so we need to clear the message composer.
         * We also need to generate a new id for the message composer.
         */
        const sendingPollMessage = !!message?.poll_id;
        if (sendingPollMessage) {
          messageComposer.state.partialNext({
            id: MessageComposer.generateId(),
            pollId: null,
          });
        } else {
          messageComposer.clear();
        }

        if (thread) {
          await thread.sendMessageWithLocalUpdate({
            localMessage,
            message,
            options: sendOptions,
          });
        } else {
          await channel.sendMessageWithLocalUpdate({
            localMessage,
            message,
            options: sendOptions,
          });
        }
      } catch (error) {
        restoreComposerStateSnapshot();
        // todo: Register notification translator
        channel.getClient().notifications.addError({
          message: t('Send message request failed'),
          options: {
            metadata: {
              reason: (error as Error).message,
            },
            originalError: error instanceof Error ? error : undefined,
            type: 'api:message:send:failed',
          },
          origin: {
            context: { messageComposer },
            emitter: 'useSendMessageFn',
          },
        });
      } finally {
        if (messageComposer.config.text.publishTypingEvents)
          await messageComposer.channel.stopTyping();
      }
    },
    // [channel, thread, messageComposer, t]
  );
};
