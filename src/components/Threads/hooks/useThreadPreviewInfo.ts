import { useMemo } from 'react';
import type { Channel, Thread, ThreadState } from 'stream-chat';

import { useStateStore } from '../../../store';
import { useChannelDisplayName } from '../../ChannelListItem/hooks/useChannelDisplayName';

export type ThreadPreviewInfoParams = {
  /** Thread to read display info from. */
  thread?: Thread;
  /** Channel to name the thread after. Defaults to the thread's own channel. */
  channel?: Channel;
  /** Title to render instead of the derived one. */
  overrideTitle?: string;
};

const threadPreviewStateSelector = ({ channel, parentMessage }: ThreadState) => ({
  channel,
  parentAuthorName: parentMessage?.user?.name ?? undefined,
});

/**
 * The title a thread is shown with, in the thread list row and the thread header.
 *
 * `displayTitle`, the first that applies:
 * 1. `overrideTitle`;
 * 2. the channel's display name, from `useChannelDisplayName`;
 * 3. the name of the parent message's author;
 * 4. `undefined`.
 *
 * Re-renders when the thread's channel, its parent message author or the channel's name changes.
 */
export const useThreadPreviewInfo = ({
  channel: channelOverride,
  overrideTitle,
  thread,
}: ThreadPreviewInfoParams) => {
  const { channel: threadChannel, parentAuthorName } =
    useStateStore(thread?.state, threadPreviewStateSelector) ?? {};
  const channelDisplayName = useChannelDisplayName(channelOverride ?? threadChannel);
  const displayTitle = overrideTitle ?? channelDisplayName ?? parentAuthorName;

  return useMemo(() => ({ displayTitle }), [displayTitle]);
};
