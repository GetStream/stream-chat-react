import React, { useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { WithAudioPlayback } from '../AudioPlayback';

import { useChatContext } from '../../context';
import { ThreadProvider } from '../Threads';
import { useStateStore } from '../../store';

import type { Thread as StreamThread, ThreadState } from 'stream-chat';
import type { ChannelConfig } from 'stream-chat';

const repliesStateSelector = ({ replies }: ChannelConfig) => ({
  repliesEnabled: replies.enabled,
});

export type ThreadProps = PropsWithChildren<{
  /**
   * The thread to render. Get it from `client.threads.ensure()` (or `client.threads.get()`) rather
   * than constructing it, so it is registered with the `ThreadManager` and receives events. `Thread`
   * loads it while its state is stale, which is how a thread built from its parent message starts
   * when it may have replies to load.
   */
  thread: StreamThread;
}>;

const selector = ({ isStateStale, parentMessage, replyCount }: ThreadState) => ({
  // Whether the parent reports a reply. Selected as a boolean so the panel does not re-render on
  // every incoming reply -- only on the transition that matters.
  hasReplies: replyCount > 0,
  isStateStale,
  parentMessage,
});

/**
 * The container for a thread panel: it provides the thread to its subtree, loads it while its state
 * is stale, scopes audio playback to it, and renders whatever you compose inside. It does not
 * register the thread with the `ThreadManager`; `client.threads.ensure()` or `thread.activate()`
 * does.
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
  const { customClasses } = useChatContext();
  const { repliesEnabled } = useStateStore(
    thread.channel.configState,
    repliesStateSelector,
  );
  const { hasReplies, isStateStale, parentMessage } = useStateStore(
    thread.state,
    selector,
  );

  // The only load trigger: a stale thread loads, once per staleness episode, as `thread.reload()`
  // ignores a call while one is in flight. A thread built from its parent message starts stale when
  // it may have replies to load; listed threads and `getThreadAndHydrate()` instances arrive loaded.
  // A thread without replies on the server answers not-found, which `reload()` takes as an empty
  // thread and leaves stale, so it loads again once its parent reports a reply.
  useEffect(() => {
    if (isStateStale) {
      void thread.reload();
    }
  }, [hasReplies, isStateStale, thread]);

  if (!parentMessage || repliesEnabled === false) return null;

  // The thread owns its audio-player pool (rather than inheriting one from an ambient <Channel>)
  // because a slot-bound Thread is a sibling of the channel, not nested inside it. Scoping it here
  // means thread audio stops when the thread closes.
  return (
    <div
      className={customClasses?.thread || 'str-chat__thread-container str-chat__thread'}
    >
      <ThreadProvider thread={thread}>
        <WithAudioPlayback playbackScope={thread}>{children}</WithAudioPlayback>
      </ThreadProvider>
    </div>
  );
};
