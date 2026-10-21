import { useCallback } from 'react';
import { type LocalMessage, type Message, MessageComposer } from 'stream-chat';
import { useMessageComposerController } from './useMessageComposerController';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useNotificationApi } from '../../Notifications';
import { discardPreEditSnapshot } from '../preEditSnapshot';

import type { MessageComposerProps } from '../MessageComposer';

const takeStateSnapshot = (messageComposer: MessageComposer) => {
  const textComposerState = messageComposer.textComposer.state.getLatestValue();
  const attachmentManagerState = messageComposer.attachmentManager.state.getLatestValue();
  const linkPreviewsManagerState =
    messageComposer.linkPreviewsManager.state.getLatestValue();
  const pollComposerState = messageComposer.pollComposer.state.getLatestValue();
  const customDataManagerState = messageComposer.customDataManager.state.getLatestValue();
  const state = messageComposer.state.getLatestValue();

  return () => {
    messageComposer.state.next(state);
    messageComposer.textComposer.state.next(textComposerState);
    messageComposer.attachmentManager.state.next(attachmentManagerState);
    messageComposer.linkPreviewsManager.state.next(linkPreviewsManagerState);
    messageComposer.pollComposer.state.next(pollComposerState);
    messageComposer.customDataManager.state.next(customDataManagerState);
  };
};

/**
 * Messages of type `error` were rejected by the server (for example bounced by moderation) and
 * exist only in the local state, so editing one sends it as a new message instead of updating it.
 */
const isRejectedByServer = (message: LocalMessage) => message.type === 'error';

/**
 * Turns the composition of an edited rejected message into a new message. The composition takes
 * over the creation time and status of the edited message, which would list the new message at the
 * old position and show it as delivered before it is sent. A reply also sent to the channel and
 * edited in the channel's composer would lose its thread, so it keeps the edited message's thread.
 */
const asNewMessage = <T extends { localMessage: LocalMessage; message: Message }>(
  composition: T,
  rejectedMessage: LocalMessage,
): T => {
  const now = new Date();
  const { parent_id } = rejectedMessage;
  return {
    ...composition,
    localMessage: {
      ...composition.localMessage,
      created_at: now,
      parent_id,
      status: 'sending',
      updated_at: now,
    },
    message: { ...composition.message, parent_id },
  };
};

export const useSubmitHandler = (props: MessageComposerProps) => {
  const { overrideSubmitHandler } = props;

  const { addNotification } = useNotificationApi();
  const { editMessage, sendMessage } = useChannelActionContext('useSubmitHandler');
  const { t } = useTranslationContext('useSubmitHandler');
  const messageComposer = useMessageComposerController();

  const handleSubmit = useCallback(
    async (event?: React.BaseSyntheticEvent) => {
      event?.preventDefault();
      const composition = await messageComposer.compose();
      if (!composition || !composition.message) return;

      // Read from the composer: the composed message never carries the `error` type.
      const { editedMessage } = messageComposer;
      const rejectedMessage =
        editedMessage && isRejectedByServer(editedMessage) ? editedMessage : undefined;
      const { localMessage, message, sendOptions } = rejectedMessage
        ? asNewMessage(composition, rejectedMessage)
        : composition;

      if (editedMessage && !rejectedMessage) {
        try {
          await editMessage(localMessage, sendOptions);
          discardPreEditSnapshot(messageComposer);
          messageComposer.clear();
        } catch (err) {
          addNotification({
            emitter: 'MessageComposer',
            incident: {
              domain: 'api',
              entity: 'message',
              operation: 'edit',
            },
            message: t('Edit message request failed'),
            severity: 'error',
          });
        }
      } else {
        const restoreComposerStateSnapshot = takeStateSnapshot(messageComposer);
        try {
          // FIXME: once MessageComposer has sendMessage method, then the following condition should be encapsulated by it
          // keep attachments, text, quoted message (treat them as draft) ... if sending a poll
          const sentPollMessage = !!message.poll_id;
          if (sentPollMessage) {
            messageComposer.state.partialNext({
              id: MessageComposer.generateId(),
              pollId: null,
            });
          } else {
            messageComposer.clear();
          }
          // Sending ends the edit, so the composer state from before it is no longer restored.
          if (rejectedMessage) discardPreEditSnapshot(messageComposer);
          // Before the send, and not awaited. The composer is already cleared, so as far as the
          // user is concerned they have stopped typing — and when composing with pending uploads
          // the send lasts as long as the upload, which would leave everyone else watching a
          // typing indicator for the whole transfer. Not awaited
          // because publishing `typing.stop` is best-effort: it must neither delay the message by
          // a round trip nor abort the send if it fails.
          if (messageComposer.config.text.publishTypingEvents) {
            messageComposer.channel.stopTyping().catch(() => undefined);
          }
          // todo: get rid of overrideSubmitHandler once MessageComposer supports submission flow
          if (overrideSubmitHandler) {
            await overrideSubmitHandler({
              cid: messageComposer.channel.cid,
              localMessage,
              message,
              sendOptions,
            });
          } else {
            await sendMessage({ localMessage, message, options: sendOptions });
          }
        } catch (err) {
          restoreComposerStateSnapshot();
          addNotification({
            emitter: 'MessageComposer',
            incident: {
              domain: 'api',
              entity: 'message',
              operation: 'send',
            },
            message: t('Send message request failed'),
            severity: 'error',
          });
        }
      }
    },
    [
      addNotification,
      editMessage,
      messageComposer,
      overrideSubmitHandler,
      sendMessage,
      t,
    ],
  );

  return { handleSubmit };
};
