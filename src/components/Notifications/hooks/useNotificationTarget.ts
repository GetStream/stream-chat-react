import { useContext } from 'react';

import { ChatViewContext } from '../../ChatView';
import { useChannelListContext, useChannelStateContext } from '../../../context';
import { useThreadContext } from '../../Threads/ThreadContext';

import type { NotificationTargetPanel } from '../notificationTarget';
import { useLegacyThreadContext } from '../../Thread';

/**
 * Resolves the panel target where notifications emitted by the current component should be displayed.
 */
export const useNotificationTarget = (): NotificationTargetPanel | undefined => {
  const chatViewContext = useContext(ChatViewContext);
  const { channels } = useChannelListContext();
  const { channel } = useChannelStateContext();
  const threadInstance = useThreadContext();
  const { legacyThread } = useLegacyThreadContext();

  if (threadInstance || legacyThread) return 'thread';
  if (channel) return 'channel';
  if (chatViewContext?.activeChatView === 'threads') return 'thread-list';
  if (channels) return 'channel-list';
  return undefined;
};
