import React, { useEffect, useRef } from 'react';
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
   * The thread to render. Get it from `client.threads.ensure()` or `client.threads.get()` so it is
   * registered with the `ThreadManager` and receives events. `Thread` loads it while its state is
   * stale, which is how a thread built from its parent message gets its replies.
   */
  thread: StreamThread;
}>;

const selector = ({
  isLoading,
  isStateStale,
  parentMessage,
  replyCount,
}: ThreadState) => ({
  // A boolean, so incoming replies do not re-render the panel.
  hasReplies: replyCount > 0,
  isLoading,
  isStateStale,
  parentMessage,
});

/**
 * Container for a thread panel: provides the thread to its subtree, loads it while its state is
 * stale, scopes audio playback to it, and renders its children. It renders no other UI and does
 * not register the thread with the `ThreadManager`; `client.threads.ensure()` or
 * `thread.activate()` does.
 *
 * ```tsx
 * <Thread thread={thread}>
 *   <ThreadHeader />
 *   <MessageList withDateSeparator={false} />
 *   <MessageComposer focus />
 * </Thread>
 * ```
 *
 * The message list renders the parent message above its replies (see `useThreadHead`).
 */
export const Thread = ({ children, thread }: ThreadProps) => {
  const { customClasses } = useChatContext();
  const { repliesEnabled } = useStateStore(
    thread.channel.configState,
    repliesStateSelector,
  );
  const { hasReplies, isLoading, isStateStale, parentMessage } = useStateStore(
    thread.state,
    selector,
  );
  // The thread and reply state that the current staleness episode last loaded for.
  const loadedFor = useRef<{ hasReplies: boolean; thread: StreamThread } | undefined>(
    undefined,
  );

  // The only load trigger: a stale thread loads once per staleness episode and reply state. A
  // thread without replies on the server answers not-found, which `reload()` takes as an empty
  // thread and leaves stale, so it loads again once its parent reports a reply. A load in flight is
  // waited out, so a reply reported during a load loads after it settles.
  useEffect(() => {
    if (!isStateStale) {
      loadedFor.current = undefined;
      return;
    }
    if (isLoading) return;
    const last = loadedFor.current;
    if (last?.thread === thread && last.hasReplies === hasReplies) return;
    loadedFor.current = { hasReplies, thread };
    void thread.reload();
  }, [hasReplies, isLoading, isStateStale, thread]);

  if (!parentMessage || repliesEnabled === false) return null;

  // The thread owns its audio-player pool: a slot-bound Thread is a sibling of the channel, not
  // nested in it, and scoping here stops thread audio when the thread closes.
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
