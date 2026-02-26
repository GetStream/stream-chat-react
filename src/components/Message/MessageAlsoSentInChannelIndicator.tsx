import React, { useEffect, useRef } from 'react';

import { IconArrowRightUp } from '../Icons';
import {
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { formatMessage, type LocalMessage } from 'stream-chat';

/**
 * Indicator shown when the message was also sent to the main channel (show_in_channel === true).
 */
export const MessageAlsoSentInChannelIndicator = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const { channel } = useChannelStateContext();
  const { jumpToMessage, openThread } = useChannelActionContext();
  const { message, threadList } = useMessageContext('MessageAlsoSentInChannelIndicator');
  const targetMessageRef = useRef<LocalMessage | null | undefined>(undefined);

  const queryParent = () =>
    channel
      .getClient()
      .search({ cid: channel.cid }, { id: message.parent_id })
      .then(({ results }) => {
        if (!results.length) {
          throw new Error('Thread has not been found');
        }
        targetMessageRef.current = formatMessage(results[0].message);
      })
      .catch((error: Error) => {
        client.notifications.addError({
          message: t('Thread has not been found'),
          options: {
            originalError: error,
            type: 'api:message:search:not-found',
          },
          origin: {
            context: { threadReply: message },
            emitter: 'MessageIsThreadReplyInChannelButtonIndicator',
          },
        });
      });

  // todo: it is not possible to jump to a message in thread
  const jumpToReplyInChannelMessages = async (id: string) => {
    await jumpToMessage(id);
    // todo: we do not have API to control, whether thread of channel message list is show - on mobile devices important
  };

  useEffect(() => {
    if (
      targetMessageRef.current ||
      targetMessageRef.current === null ||
      !message.parent_id
    )
      return;
    const localMessage = channel.state.findMessage(message.parent_id);
    if (localMessage) {
      targetMessageRef.current = localMessage;
      return;
    }
  }, [channel, message]);

  const handleClickViewReference = async () => {
    if (!targetMessageRef.current) {
      // search query is performed here in order to prevent multiple search queries in useEffect
      // due to the message list 3x remounting its items
      if (threadList) {
        await jumpToReplyInChannelMessages(message.id); // we are in thread, and we want to jump to this reply in the main message list
        return;
      } else await queryParent(); // we are in the main list and need to query the thread
    }
    const target = targetMessageRef.current;
    if (!target) {
      // prevent further search queries if the message is not found in the DB
      targetMessageRef.current = null;
      return;
    }

    if (threadList) await jumpToReplyInChannelMessages(message.id);
    else openThread(target);
  };

  if (!message?.show_in_channel) return null;

  return (
    <div className='str-chat__message-also-sent-in-channel' role='status'>
      <IconArrowRightUp />
      <span>{threadList ? t('Also sent in channel') : t('Replied to a thread')}</span>
      <span> · </span>
      <button
        className='str-chat__message-also-sent-in-channel__link-button'
        onClick={handleClickViewReference}
        type='button'
      >
        {t('View')}
      </button>
    </div>
  );
};
