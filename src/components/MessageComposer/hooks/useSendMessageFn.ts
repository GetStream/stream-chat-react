import { useTranslationContext } from '../../../context/TranslationContext';
import { useMessageComposerController } from '..';
import { useChannel, useThreadContext } from '../../..';
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
  const channel = useChannel();
  const thread = useThreadContext();
  const messageComposer = useMessageComposerController();
  const { t } = useTranslationContext('useSendMessageFn');

  return useStableCallback(
    async () => {
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      const { localMessage, message, sendOptions } = composition;
      const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
      try {
        /**
         * Reset the composer BEFORE awaiting the send, not after. The message data was already
         * captured by `compose()` above, so clearing now is safe — and it is required for
         * correctness: `sendMessageWithLocalUpdate` awaits a network round-trip, and clearing only
         * after it opens a long window during which the user's next keystrokes (or an in-flight,
         * async `textComposer.handleChange` commit) race with the clear. That race drops or fails to
         * clear rapidly typed-and-sent messages. On failure the snapshot is restored below.
         *
         * When sending a poll message no text/attachments are allowed, so instead of a full clear we
         * only detach the poll and generate a fresh composer id, keeping any drafted content.
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

        await (thread ?? channel).sendMessageWithLocalUpdate({
          localMessage,
          message,
          options: sendOptions,
        });
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
