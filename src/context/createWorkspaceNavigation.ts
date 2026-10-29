import { Thread as StreamThreadClass } from 'stream-chat';

import { defaultWorkspaceNavigation } from './WorkspaceNavigationContext';

import type { Channel as StreamChannel, Thread as StreamThread } from 'stream-chat';
import type { WorkspaceNavigation } from './WorkspaceNavigationContext';

/** State and setters for {@link createWorkspaceNavigation}. */
export type CreateWorkspaceNavigationParams = {
  /** Shows a channel in the channel panel, or empties it with `undefined`. */
  setChannel: (channel: StreamChannel | undefined) => void;
  /** Shows a thread in the thread panel, or empties it with `undefined`. */
  setThread: (thread: StreamThread | undefined) => void;
  /** The channel shown in the channel panel, if any. */
  channel?: StreamChannel;
  /** The thread shown in the thread panel, if any. */
  thread?: StreamThread;
};

/**
 * Builds a complete {@link WorkspaceNavigation} for a layout without `ChatView`: one channel panel
 * and one thread panel beside it, held in the integrator's own state. Provide the result with
 * `WorkspaceNavigationProvider`, memoized on `channel` and `thread`.
 *
 * - Opening a different channel closes the thread; closing the channel closes both.
 * - `{ channel, message }` thread targets resolve with `client.threads.ensure`.
 * - The thread panel is dismissable, so `ThreadHeader` renders its close button; the channel panel
 *   is the primary one and is not.
 * - Nothing is stacked, so `canGoBack` is always false. `isThreadsView` is false.
 *
 * Navigation options (`additive`, `layer`, `panel`) are ignored. Override members by spreading the
 * result, e.g. to also close a side panel when a thread opens.
 */
export const createWorkspaceNavigation = ({
  channel,
  setChannel,
  setThread,
  thread,
}: CreateWorkspaceNavigationParams): WorkspaceNavigation => {
  const isOpenThread = (threadId?: string) =>
    !!thread && (threadId === undefined || threadId === thread.id);

  return {
    ...defaultWorkspaceNavigation,
    closeChannel: (cid) => {
      if (!channel || (cid !== undefined && cid !== channel.cid)) return;
      setChannel(undefined);
      setThread(undefined);
    },
    closeThread: (threadId) => {
      if (isOpenThread(threadId)) setThread(undefined);
    },
    isChannelActive: (cid) => cid !== undefined && cid === channel?.cid,
    isThreadActive: (threadId) => threadId !== undefined && threadId === thread?.id,
    isThreadDismissable: isOpenThread,
    openChannel: (nextChannel) => {
      if (nextChannel !== channel) setThread(undefined);
      setChannel(nextChannel);
    },
    openChannels: channel ? [channel] : [],
    openThread: (target) => {
      setThread(
        target instanceof StreamThreadClass
          ? target
          : target.channel.getClient().threads.ensure({
              channel: target.channel,
              parentMessage: target.message,
            }),
      );
    },
    openThreads: thread ? [thread] : [],
  };
};
