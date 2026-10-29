import { useEffect, useRef } from 'react';
import type { ChannelPaginator, ChannelPaginatorState } from 'stream-chat';

import { useWorkspaceNavigation } from '../../../context/WorkspaceNavigationContext';

const firstChannelSelector = ({ items }: ChannelPaginatorState) => ({
  first: items?.[0],
  // `items === undefined` means "never queried": the initial state, and where the paginator
  // returns when its data is discarded (e.g. by `client.disconnectUser`).
  isUnloaded: items === undefined,
});

/**
 * Opens the first channel of `paginator` through workspace navigation once its first page loads,
 * unless a channel is already open. Restores v14's `ChannelList` `setActiveChannelOnMount` default.
 *
 * Whether to open is decided by the navigation's `openChannels`, not by state of this hook, so a
 * remount (e.g. a `ChatView` view switch that unmounts the list) does not re-open the first channel
 * over the one the user picked. Each load counts once: a channel that later moves to the top of
 * the list is not opened, but a list reset by `client.disconnectUser` opens its first channel
 * again when it reloads. Call it below the navigation provider (`ChatView`, or your own
 * `WorkspaceNavigationProvider`).
 */
export const useOpenFirstChannel = (paginator: ChannelPaginator) => {
  const { openChannel, openChannels } = useWorkspaceNavigation();
  // Read at load time: the navigation changes with every open and close, and resubscribing on
  // each change would count an already loaded page as a new load.
  const navigationRef = useRef({ hasOpenChannel: openChannels.length > 0, openChannel });

  useEffect(() => {
    navigationRef.current = { hasOpenChannel: openChannels.length > 0, openChannel };
  });

  useEffect(() => {
    let awaitingLoad = true;
    return paginator.state.subscribeWithSelector(
      firstChannelSelector,
      ({ first, isUnloaded }) => {
        if (isUnloaded) {
          awaitingLoad = true;
          return;
        }
        if (!awaitingLoad) return;
        awaitingLoad = false;
        const { hasOpenChannel, openChannel } = navigationRef.current;
        if (first && !hasOpenChannel) openChannel(first);
      },
    );
  }, [paginator]);
};
