import type { MembersState, WatcherState } from 'stream-chat';

import { useChannel, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';

const memberCountSelector = (nextValue: MembersState) => ({
  memberCount: nextValue.memberCount,
});

const watcherCountSelector = (nextValue: WatcherState) => ({
  watcherCount: nextValue.watcherCount,
});

/**
 * Returns the channel header online status text (e.g. "Online", "Offline", or
 * "X members · Y online"). Returns null when the channel has no members (nothing to show).
 *
 * Reactive counts come from the channel's members/watcher state stores; DM detection and
 * "others online" are delegated to `useIsDmChannel` / `useChannelHasMembersOnline`, which
 * subscribe to the state they each need.
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { memberCount } = useStateStore(channel.state.membersStore, memberCountSelector);
  const { watcherCount } = useStateStore(
    channel.state.watcherStore,
    watcherCountSelector,
  );
  const isDirectMessagingChannel = useIsDmChannel();
  const hasMembersOnline = useChannelHasMembersOnline({
    enabled: isDirectMessagingChannel,
  });

  if (!memberCount) return null;

  if (isDirectMessagingChannel) {
    return hasMembersOnline ? t('Online') : t('Offline');
  }

  return `${t('{{ memberCount }} members', { memberCount })} · ${t('{{ watcherCount }} online', { watcherCount })}`;
}
