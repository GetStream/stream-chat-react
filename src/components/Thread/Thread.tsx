import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { WithAudioPlayback } from '../AudioPlayback';

import { useChatContext } from '../../context';
import { ThreadProvider } from '../Threads';
import { useStateStore } from '../../store';

import type { LocalMessage, Thread as StreamThread, ThreadState } from 'stream-chat';
import type { ChannelConfig } from 'stream-chat';

const repliesStateSelector = ({ replies }: ChannelConfig) => ({
  repliesEnabled: replies.enabled,
});

export type ThreadProps = PropsWithChildren<{
  /**
   * The thread to render. Initialize it before passing it in; `Thread` does not query for it --
   * it loads the replies of a thread the `ThreadManager` does not already hold.
   */
  thread: StreamThread;
}>;

const selector = (nextValue: ThreadState) => ({
  isStateStale: nextValue.isStateStale,
  parentMessage: nextValue.parentMessage,
  replyCount: nextValue.replyCount,
});

const messagePaginatorSelector = ({
  isLoading,
  items,
  lastQueryError,
}: {
  isLoading: boolean;
  items: LocalMessage[] | undefined;
  lastQueryError?: Error;
}) => ({
  isLoading,
  items,
  lastQueryError,
});

const threadManagerSelector = ({ threads }: { threads: StreamThread[] }) => ({ threads });

/**
 * The container for a thread panel: it provides the thread to its subtree, loads it, registers it
 * with the `ThreadManager`, scopes audio playback to it, and renders whatever you compose inside.
 *
 * It renders no UI of its own, the way `Channel` does not -- put the parts you want in as
 * children, and their own props say how they behave:
 *
 * ```tsx
 * <Thread thread={thread}>
 *   <ThreadHeader />
 *   <MessageList withDateSeparator={false} />
 *   <MessageComposer focus />
 * </Thread>
 * ```
 *
 * The parent message is not composed here: a message list renders it above its replies (see
 * `useThreadHead`), because it has to sit inside the list's scroll container.
 *
 * One component: the wrapper that used to sit here existed only to key this subtree on the thread,
 * which rebuilt everything below on a thread switch -- including parts that hold no per-thread
 * state. The reset now lives in the message list, which is what actually carries state scoped to
 * the replies it shows.
 */
export const Thread = ({ children, thread }: ThreadProps) => {
  const { client, customClasses } = useChatContext();
  const { repliesEnabled } =
    useStateStore(thread.channel.configState, repliesStateSelector) ?? {};
  const { isStateStale, parentMessage, replyCount } =
    useStateStore(thread.state, selector) ?? {};
  const threadPaginatorState = useStateStore(
    thread.messagePaginator?.state,
    messagePaginatorSelector,
  );
  const threadManagerState = useStateStore(
    client.threads.state,
    threadManagerSelector,
  ) ?? {
    threads: client.threads.state.getLatestValue().threads,
  };
  const isThreadManaged = threadManagerState.threads.some(
    (managedThread) => managedThread.id === thread.id,
  );

  // A thread exists server-side only once its parent has a reply, so reloading at `replyCount` 0
  // can only 404 — `Thread.reload()` swallows that and returns without state.
  //
  // Deferred, not cancelled: only a successful reload clears `isStateStale`, so a thread that
  // stays stale reloads via the effect below as soon as `replyCount` goes above 0 — the same
  // moment the rest of the UI learns about replies missed while unwatched.
  const hasServerSideThread = (replyCount ?? 0) > 0;

  // Only an unmanaged thread is loaded here. The `ThreadManager` already loads and refreshes the
  // ones it holds; an instance from `getThreadAndHydrate()` is registered nowhere, so it has no
  // other owner.
  useEffect(() => {
    if (isThreadManaged) return;
    if (!hasServerSideThread) return;
    if (threadPaginatorState?.items !== undefined || threadPaginatorState?.isLoading)
      return;
    void thread.reload();
  }, [
    hasServerSideThread,
    isThreadManaged,
    thread,
    threadPaginatorState?.isLoading,
    threadPaginatorState?.items,
  ]);

  useEffect(() => {
    if (isStateStale && hasServerSideThread) {
      void thread.reload();
    }
  }, [hasServerSideThread, isStateStale, thread]);

  useEffect(() => {
    if (isThreadManaged) return;
    if (threadPaginatorState?.isLoading) return;
    if (threadPaginatorState?.lastQueryError) return;
    if (threadPaginatorState?.items === undefined) return;

    client.threads.state.next((current) => {
      if (current.threads.some((managedThread) => managedThread.id === thread.id)) {
        return current;
      }
      return {
        ...current,
        threads: [thread, ...current.threads],
      };
    });
  }, [
    client.threads.state,
    isThreadManaged,
    thread,
    threadPaginatorState?.isLoading,
    threadPaginatorState?.items,
    threadPaginatorState?.lastQueryError,
  ]);

  if (!parentMessage || repliesEnabled === false) return null;

  const threadClass =
    customClasses?.thread || 'str-chat__thread-container str-chat__thread';

  // The thread owns its audio-player pool (rather than inheriting one from an ambient <Channel>)
  // because a slot-bound Thread is a sibling of the channel, not nested inside it. Scoping it here
  // means thread audio stops when the thread closes.
  return (
    <div className={threadClass}>
      <ThreadProvider thread={thread}>
        <WithAudioPlayback playbackScope={thread}>{children}</WithAudioPlayback>
      </ThreadProvider>
    </div>
  );
};
