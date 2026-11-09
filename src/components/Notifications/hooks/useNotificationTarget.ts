import { useChannelListContext, useWorkspaceNavigation } from '../../../context';
import { useChannelInstanceContext } from '../../../context/ChannelInstanceContext';
import { useThreadContext } from '../../Threads/ThreadContext';

import type { NotificationTargetPanel } from '../notificationTarget';

/**
 * Resolves the panel where notifications emitted by the current component are displayed.
 *
 * @returns The first match of thread, channel, thread list, channel list, or undefined.
 */
export const useNotificationTarget = (): NotificationTargetPanel | undefined => {
  const { isThreadsView } = useWorkspaceNavigation();
  const { paginator } = useChannelListContext();
  // Does not throw outside a `Channel` subtree, unlike `useChannel`.
  const { channel } = useChannelInstanceContext();
  const threadInstance = useThreadContext();

  if (threadInstance) return 'thread';
  if (channel) return 'channel';
  if (isThreadsView) return 'thread-list';
  if (paginator) return 'channel-list';
  return undefined;
};
