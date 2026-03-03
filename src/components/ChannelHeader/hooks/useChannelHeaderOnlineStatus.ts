import type { ChannelMemberResponse, MembersState, WatcherState } from 'stream-chat';

import { useChannel, useChatContext, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';

const membersSelector = (nextValue: MembersState) => ({
  memberCount: nextValue.memberCount,
  members: nextValue.members,
});

const watchersSelector = (nextValue: WatcherState) => ({
  watcherCount: nextValue.watcherCount,
  watchers: nextValue.watchers,
});

/**
 * Returns the channel header online status text (e.g. "Online", "Offline", or "X members, Y online").
 * Returns null when the channel has no members (nothing to show).
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const channel = useChannel();
  const { memberCount, members } = useStateStore(
    channel.state.membersStore,
    membersSelector,
  );
  const { watcherCount, watchers } = useStateStore(
    channel.state.watcherStore,
    watchersSelector,
  );

  if (!memberCount) return null;

  const isDmChannel =
    memberCount === 1 ||
    (memberCount === 2 &&
      Object.values(members).some(
        (member: ChannelMemberResponse) => member.user?.id === client.user?.id,
      ));

  if (isDmChannel) {
    const hasWatchers = Object.keys(watchers).length > 0;
    return hasWatchers ? t('Online') : t('Offline');
  }

  return `${t('{{ memberCount }} members', { memberCount })}, ${t('{{ watcherCount }} online', { watcherCount })}`;
}
