import {
  useChannel,
  useChatContext,
  useMessageContext,
  useTranslationContext,
} from '../../../context';
import { useChatViewNavigation, useSlotForKey } from '../../ChatView';
import { useThreadContext } from '../../Threads';

export type MessageAlsoSentInChannelNavigation = {
  /** True when rendered inside a thread (the reply was "also sent in channel"); false in a
   *  channel message list (the message is a thread reply, "replied to a thread"). */
  isInThread: boolean;
  /** Whether the current message is shown in the channel (i.e. the indicator should render). */
  isShownInChannel: boolean;
  /** Composed handler used by the default indicator: jumps to the referenced message, picking the
   *  channel or the thread depending on where the indicator is rendered. */
  viewReference: () => Promise<void>;
  /** Jump to the reply in the channel message list (used from inside a thread). */
  viewReplyInChannel: (messageId?: string) => Promise<void>;
  /** Open the reply's parent thread and jump to the reply (used from a channel message list). */
  viewReplyInThread: (replyId?: string, parentId?: string) => Promise<void>;
};

/**
 * Encapsulates the navigation behind {@link MessageAlsoSentInChannelIndicator} so integrators can
 * reuse it (or compose extra behavior around it) without re-implementing the component. Returns the
 * composed `viewReference` handler plus the granular `viewReplyInChannel` / `viewReplyInThread`
 * actions and the `isInThread` / `isShownInChannel` flags used for rendering.
 */
export const useMessageAlsoSentInChannelNavigation =
  (): MessageAlsoSentInChannelNavigation => {
    const { channelPaginatorsOrchestrator, client } = useChatContext();
    const { t } = useTranslationContext();
    const channel = useChannel();
    const { open } = useChatViewNavigation();
    const thread = useThreadContext();
    const { message } = useMessageContext('useMessageAlsoSentInChannelNavigation');
    // The slot (in the *active* view) currently showing this channel, if any. Asking about the
    // channel by key — not by view name — keeps this generic: whichever view the registry maps the
    // `channel` kind to, and whatever an integrator named it, this is defined only when the channel
    // is already on screen in the active view.
    const channelSlot = useSlotForKey(channel.cid);

    const addThreadNotFoundNotification = (error: Error) => {
      client.notifications.addError({
        message: t('Thread has not been found'),
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
      if (!channelSlot) {
        // The channel isn't shown in the active view — navigate to it. `open` resolves the
        // channel kind's view from the slot registry and switches there (no hard-coded view name);
        // `ingestChannel` surfaces it in the channel list(s) incrementally instead of forcing a
        // full list re-query.
        open({ key: channel.cid ?? undefined, kind: 'channel', source: channel });
        // Load the channel's state (members, config, read state; registers it in
        // `client.activeChannels`) so `ingestChannel` below can match it against paginator filters
        // and the panel has data to render. `messages: { limit: 0 }` fetches no messages — the
        // `jumpToMessage` call at the end loads the message window around the target, so pulling a
        // default page here would be wasted, immediately-superseded work. `channel.initialized` is
        // only set by `channel.watch()` (the channel list watches its channels), so this guard
        // effectively means "not already loaded via the list"; a plain `query()` neither watches
        // nor flips `initialized`.
        if (!channel.initialized) {
          await channel.query({ messages: { limit: 0 } });
        }
        // Surface the (now initialized) channel in the list(s) so its data is available for filter
        // matching; `ingestChannel` dedupes by cid and inserts in sort order — safe to call always.
        channelPaginatorsOrchestrator.ingestChannel(channel);
      }

      await channel.messagePaginator.jumpToMessage(messageId);
    };

    const viewReplyInThread = async (
      replyId = message?.id,
      parentId = message?.parent_id,
    ) => {
      if (!replyId || !parentId) return;
      let targetThread = client.threads.threadsById[parentId];

      if (!targetThread) {
        try {
          targetThread = await client.getThread(parentId, { watch: true });
        } catch (error) {
          addThreadNotFoundNotification(error as Error);
          return;
        }
      }

      open({ key: targetThread.id ?? undefined, kind: 'thread', source: targetThread });
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
