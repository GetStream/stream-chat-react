import type { ChannelWatchState, MembersState } from 'stream-chat';

import { useChannel, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';

const memberCountSelector = (nextValue: MembersState) => ({
  memberCount: nextValue.memberCount,
});

const watcherCountSelector = (nextValue: ChannelWatchState) => ({
  watcherCount: nextValue.watcherCount,
});

/**
 * Online status text for the channel header: "Online" or "Offline" for a DM, otherwise
 * "N members · M online". Returns null when the channel has no members.
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { memberCount } = useStateStore(channel.state, memberCountSelector);
  const { watcherCount } = useStateStore(channel.state, watcherCountSelector);
  const isDirectMessagingChannel = useIsDmChannel();
  const hasMembersOnline = useChannelHasMembersOnline({
    enabled: isDirectMessagingChannel,
  });

  if (!memberCount) return null;

  if (isDirectMessagingChannel) {
    return hasMembersOnline
      ? t('common.online.label', 'Online')
      : t('common.offline.label', 'Offline');
  }

  return `${t('channelHeader.online.members.label', '{{ memberCount }} members', { memberCount })} · ${t('channelHeader.online.online.label', '{{ watcherCount }} online', { watcherCount })}`;
}
