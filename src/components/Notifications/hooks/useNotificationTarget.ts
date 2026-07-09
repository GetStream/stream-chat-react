import { useContext } from 'react';

import { ChatViewContext } from '../../ChatView';
import { useChannelListContext } from '../../../context';
// MERGE-RECONCILE: the deleted ChannelStateContext's `channel` is read here only to detect
// whether a channel is in scope; migrated to useChannelInstanceContext (safe — returns
// undefined channel outside a Channel subtree, unlike useChannel which throws).
import { useChannelInstanceContext } from '../../../context/ChannelInstanceContext';
import { useThreadContext } from '../../Threads/ThreadContext';

import type { NotificationTargetPanel } from '../notificationTarget';
import { useLegacyThreadContext } from '../../Thread';

/**
 * Resolves the panel target where notifications emitted by the current component should be displayed.
 */
export const useNotificationTarget = (): NotificationTargetPanel | undefined => {
  const chatViewContext = useContext(ChatViewContext);
  const { paginator } = useChannelListContext();
  const { channel } = useChannelInstanceContext();
  const threadInstance = useThreadContext();
  const { legacyThread } = useLegacyThreadContext();

  if (threadInstance || legacyThread) return 'thread';
  if (channel) return 'channel';
  if (chatViewContext?.activeChatView === 'threads') return 'thread-list';
  if (paginator) return 'channel-list';
  return undefined;
};
