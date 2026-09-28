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
 * Returns the channel header online status text (e.g. "Online", "Offline", or
 * "X members · Y online"). Returns null when the channel has no members (nothing to show).
 *
 * Reactive counts come from the channel's unified reactive state; DM detection and
 * "others online" are delegated to `useIsDmChannel` / `useChannelHasMembersOnline`, which
 * subscribe to the state they each need.
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
