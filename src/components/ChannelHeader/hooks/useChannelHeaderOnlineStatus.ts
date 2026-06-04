import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { isDmChannel } from '../../../utils';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';
import type { Channel } from 'stream-chat';

export type UseChannelHeaderOnlineStatusParams = {
  channel?: Channel;
  watcherCount?: number;
};

/**
 * Returns the channel header online status text (e.g. "Online", "Offline", or "X members, Y online").
 * Returns null when the channel has no members (nothing to show).
 */
export function useChannelHeaderOnlineStatus({
  channel: channelOverride,
  watcherCount: watcherCountOverride,
}: UseChannelHeaderOnlineStatusParams = {}): string | null {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel: contextChannel, watcherCount: contextWatcherCount = 0 } =
    useChannelStateContext();
  const channel = channelOverride ?? contextChannel;
  const watcherCount = watcherCountOverride ?? contextWatcherCount;
  const { member_count: memberCount = 0 } = channel?.data || {};
  const isDirectMessagingChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });
  const hasMembersOnline = useChannelHasMembersOnline({
    channel,
    enabled: isDirectMessagingChannel,
  });

  if (!memberCount) return null;

  if (isDirectMessagingChannel) {
    return hasMembersOnline ? t('Online') : t('Offline');
  }

  return `${t('{{ memberCount }} members', { memberCount })} · ${t('{{ watcherCount }} online', { watcherCount })}`;
}
