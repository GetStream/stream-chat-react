import {
  useChannel,
  useChatContext,
  useMessageContext,
  useTranslationContext,
  useWorkspaceNavigation,
} from '../../../context';
import { useThreadContext } from '../../Threads';

export type MessageAlsoSentInChannelNavigation = {
  /** True when rendered inside a thread, false in a channel message list. */
  isInThread: boolean;
  /** Whether the message is shown in the channel. The default indicator renders only then. */
  isShownInChannel: boolean;
  /** Jumps to the referenced message: in the channel from a thread, in its thread otherwise. */
  viewReference: () => Promise<void>;
  /** Jumps to the reply in the channel message list, opening the channel first if needed. */
  viewReplyInChannel: (messageId?: string) => Promise<void>;
  /** Opens the reply's parent thread and jumps to the reply. */
  viewReplyInThread: (replyId?: string, parentId?: string) => Promise<void>;
};

/**
 * Navigation behind {@link MessageAlsoSentInChannelIndicator}, reusable in custom indicators.
 *
 * @returns The navigation handlers and the flags the indicator renders from.
 */
export const useMessageAlsoSentInChannelNavigation =
  (): MessageAlsoSentInChannelNavigation => {
    const { channelManager, client } = useChatContext();
    const { t } = useTranslationContext();
    const channel = useChannel();
    const { isChannelActive, openChannel, openThread } = useWorkspaceNavigation();
    const thread = useThreadContext();
    const { message } = useMessageContext();

    const addThreadNotFoundNotification = (error: Error) => {
      client.notifications.addError({
        message: t('notification.replySearchFailed', 'Thread has not been found'),
        options: {
          originalError: error,
          type: 'api:message:search:not-found',
        },
        origin: {
          context: { threadReply: message },
          emitter: 'useMessageAlsoSentInChannelNavigation',
        },
      });
    };

    const viewReplyInChannel = async (messageId = message?.id) => {
      if (!messageId) return;
      // Open the channel first when it is not active in the workspace.
      const needsNavigation = !isChannelActive(channel.cid);
      if (needsNavigation) {
        openChannel(channel);
      }

      await channel.messagePaginator.jumpToMessage(messageId);

      if (needsNavigation) {
        channelManager.ingestChannel(channel);
      }
    };

    const viewReplyInThread = async (
      replyId = message?.id,
      parentId = message?.parent_id,
    ) => {
      if (!replyId || !parentId) return;
      let targetThread = client.threads.get(parentId);

      if (!targetThread) {
        try {
          const fetchedThread = await client.getThreadAndHydrate(parentId, {
            watch: true,
          });
          // An instance registered while the request was in flight (e.g. by a thread list query)
          // wins, so there is only one live instance per thread.
          targetThread = client.threads.get(parentId) ?? fetchedThread;
        } catch (error) {
          addThreadNotFoundNotification(error as Error);
          return;
        }
      }

      openThread(targetThread);
      await targetThread.messagePaginator.jumpToMessage(replyId);
    };

    const viewReference = async () => {
      if (thread) {
        await viewReplyInChannel(message?.id);
        return;
      }

      if (!message?.parent_id) return;
      await viewReplyInThread(message.id, message.parent_id);
    };

    return {
      isInThread: !!thread,
      isShownInChannel: !!message?.show_in_channel,
      viewReference,
      viewReplyInChannel,
      viewReplyInThread,
    };
  };
