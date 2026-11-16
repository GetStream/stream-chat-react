import type { ChannelWatchState, MembersState } from 'stream-chat';

import { useChannel, useTranslationContext } from '../../../context';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';

const memberCountSelector = ({ activeMemberCount, memberCount }: MembersState) => ({
  activeMemberCount,
  memberCount,
});

const watcherCountSelector = (nextValue: ChannelWatchState) => ({
  watcherCount: nextValue.watcherCount,
});

/**
 * Online status text for the channel in context, as the channel header shows it: "Online" or
 * "Offline" for a direct message, otherwise "N members · M online", translated. Returns null when
 * the channel has no members. `ChannelHeaderSubtitle` renders it when nobody is typing.
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const channel = useChannel();
  const { activeMemberCount, memberCount } = useStateStore(
    channel.state,
    memberCountSelector,
  );
  const displayedMemberCount = activeMemberCount ?? memberCount;
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

  return `${t('channelHeader.online.members.label', '{{ memberCount }} members', { memberCount: displayedMemberCount })} · ${t('channelHeader.online.online.label', '{{ watcherCount }} online', { watcherCount })}`;
}
