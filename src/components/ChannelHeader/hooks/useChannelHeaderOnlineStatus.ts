import type { Channel, ChannelWatchState, MembersState } from 'stream-chat';

import { useTranslationContext } from '../../../context';
import { useResolvedChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { useChannelHasMembersOnline } from './useChannelHasMembersOnline';

const memberCountSelector = (nextValue: MembersState) => ({
  memberCount: nextValue.memberCount,
});

const watcherCountSelector = (nextValue: ChannelWatchState) => ({
  watcherCount: nextValue.watcherCount,
});

export type UseChannelHeaderOnlineStatusParams = {
  channel?: Channel;
};

/**
 * Online status text for a channel, as the channel header shows it: "Online" or "Offline" for a
 * direct message, otherwise "N members · M online", translated. Returns null when the channel has
 * no members. `ChannelHeaderSubtitle` renders it when nobody is typing. `channel` defaults to the
 * channel in context.
 */
export function useChannelHeaderOnlineStatus({
  channel: channelOverride,
}: UseChannelHeaderOnlineStatusParams = {}): string | null {
  const { t } = useTranslationContext();
  const channel = useResolvedChannel(channelOverride);
  const { memberCount } = useStateStore(channel.state, memberCountSelector);
  const { watcherCount } = useStateStore(channel.state, watcherCountSelector);
  const isDirectMessagingChannel = useIsDmChannel({ channel });
  const hasMembersOnline = useChannelHasMembersOnline({
    channel,
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
