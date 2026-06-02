import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { isDmChannel } from '../../../utils';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';

/**
 * Returns the channel header online status text (e.g. "Online", "Offline", or "X members, Y online").
 * Returns null when the channel has no members (nothing to show).
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel, watcherCount = 0 } = useChannelStateContext();
  const { member_count: memberCount = 0 } = channel?.data || {};
  const isDirectMessagingChannel = isDmChannel({
    channel,
    ownUserId: client.user?.id,
  });
  const hasMembersOnline = useChannelHasMembersOnline(isDirectMessagingChannel);

  if (!memberCount) return null;

  if (isDirectMessagingChannel) {
    return hasMembersOnline ? t('Online') : t('Offline');
  }

  return `${t('{{ memberCount }} members', { memberCount })} · ${t('{{ watcherCount }} online', { watcherCount })}`;
}
