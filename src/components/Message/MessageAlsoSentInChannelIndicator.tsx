import React from 'react';

import { IconArrowRightUp } from '../Icons';
import {
  useChannel,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';
import { useStateStore } from '../../store';
import { useChatViewContext, useChatViewNavigation } from '../ChatView';
import { useThreadContext } from '../Threads';

const activeViewSelector = ({ activeView }: { activeView: string }) => ({ activeView });

/**
 * Indicator shown when the message was also sent to the main channel (show_in_channel === true).
 */
export const MessageAlsoSentInChannelIndicator = () => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { openChannel, openThread } = useChatViewNavigation();
  const { layoutController } = useChatViewContext();
  const thread = useThreadContext();
  const { message } = useMessageContext('MessageAlsoSentInChannelIndicator');
  const { activeView } = useStateStore(layoutController.state, activeViewSelector) ?? {
    activeView: layoutController.state.getLatestValue().activeView,
  };

  const addThreadNotFoundNotification = (error: Error) => {
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
  };

  const jumpToReplyInChannelMessages = async (id: string) => {
    if (activeView === 'threads') {
      // todo: switching views to a specific channel will work only with ChannelListOrchestrator because it will not force us to reload the whole channel list
      openChannel(channel);
      // TODO: Use ChannelListOrchestrator to check whether this channel is already loaded before querying.
      await channel.query({ messages: { limit: 0 } });
    }

    await channel.messagePaginator.jumpToMessage(id);
  };

  const jumpToReplyInThread = async (replyId: string, parentId: string) => {
    let targetThread = client.threads.threadsById[parentId];

    if (!targetThread) {
      try {
        targetThread = await client.getThread(parentId, { watch: true });
      } catch (error) {
        addThreadNotFoundNotification(error as Error);
        return;
      }
    }

    openThread(targetThread);
    await targetThread.messagePaginator.jumpToMessage(replyId);
  };

  const handleClickViewReference = async () => {
    if (thread) {
      await jumpToReplyInChannelMessages(message.id);
      return;
    }

    if (!message.parent_id) return;
    await jumpToReplyInThread(message.id, message.parent_id);
  };

  if (!message?.show_in_channel) return null;

  return (
    <div className='str-chat__message-also-sent-in-channel' role='status'>
      <IconArrowRightUp />
      <span>{thread ? t('Also sent in channel') : t('Replied to a thread')}</span>
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
