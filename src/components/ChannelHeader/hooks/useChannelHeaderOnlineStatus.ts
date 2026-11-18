import { useMemo } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';

import { useTranslationContext } from '../../../context';
import { useResolvedChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { getChannelOwnUserId } from '../../../utils/getChannelOwnUserId';
import { getOnlineMembers } from './onlineMembers';
import { useChannelHasOtherMembersOnline } from './useChannelHasOtherMembersOnline';

const membersSelector = ({ memberCount, members, watchers }: ChannelStateData) => ({
  memberCount,
  members,
  watchers,
});

export type UseChannelHeaderOnlineStatusParams = {
  channel?: Channel;
};

/**
 * The channel header's online status, translated: "Online" or "Offline" for a DM (the other
 * member), otherwise "N members · M online", where M counts the loaded members whose `user.online`
 * is true or who watch the channel. Null when the channel has no members, or for a DM whose current
 * user is unknown. `channel` defaults to the channel in context.
 *
 * `user.online` stays current only on channels queried or watched with `presence: true`. The copy
 * gets the count as both `{{ onlineCount }}` and `{{ watcherCount }}`.
 */
export function useChannelHeaderOnlineStatus({
  channel: channelOverride,
}: UseChannelHeaderOnlineStatusParams = {}): string | null {
  const { t } = useTranslationContext();
  const channel = useResolvedChannel(channelOverride);
  const { memberCount, members, watchers } = useStateStore(
    channel.state,
    membersSelector,
  );
  const onlineCount = useMemo(
    () => getOnlineMembers({ members, watchers }).length,
    [members, watchers],
  );
  const isDirectMessagingChannel = useIsDmChannel({ channel });
  const hasOtherMembersOnline = useChannelHasOtherMembersOnline({
    channel,
    enabled: isDirectMessagingChannel,
  });

  if (!memberCount) return null;

  if (isDirectMessagingChannel) {
    // Without the current user, the online member can't be told apart from them.
    if (!getChannelOwnUserId(channel)) return null;
    return hasOtherMembersOnline
      ? t('common.online.label', 'Online')
      : t('common.offline.label', 'Offline');
  }

  return `${t('channelHeader.online.members.label', '{{ memberCount }} members', { memberCount })} · ${t('channelHeader.online.online.label', '{{ onlineCount }} online', { onlineCount, watcherCount: onlineCount })}`;
}
