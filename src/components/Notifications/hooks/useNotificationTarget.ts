import { useChatViewContext } from '../../ChatView';
import { useChannelStateContext } from '../../../context';
import { useThreadContext } from '../../Threads/ThreadContext';

import type { NotificationTargetPanel } from '../notificationTarget';
import { useLegacyThreadContext } from '../../Thread';

/**
 * Resolves the panel target where notifications emitted by the current component should be displayed.
 */
export const useNotificationTarget = (): NotificationTargetPanel => {
  const { activeChatView } = useChatViewContext();
  const { channel } = useChannelStateContext();
  const threadInstance = useThreadContext();
  const { legacyThread } = useLegacyThreadContext();

  if (threadInstance || legacyThread) return 'thread';
  if (channel) return 'channel';
  if (activeChatView === 'threads') return 'thread-list';
  return 'channel-list';
};
