import { useMemo } from 'react';
import type { Channel, ChannelStateData } from 'stream-chat';

import { useTranslationContext } from '../../../context';
import { useResolvedChannel } from '../../../context/useContextChannel';
import { useStateStore } from '../../../store';
import { useIsDmChannel } from '../../../hooks';
import { getOnlineMembers } from './onlineMembers';
import { useChannelHasOtherMembersOnline } from './useChannelHasOtherMembersOnline';

const membersSelector = ({
  activeMemberCount,
  memberCount,
  members,
  watchers,
}: ChannelStateData) => ({
  activeMemberCount,
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
 * is true or who watch the channel. Null when the channel has no members. `channel` defaults to the
 * channel in context.
 *
 * N is the channel's active member count (members who are not deactivated or deleted) when the
 * channel was queried with `include_active_member_count: true`, otherwise its total member count.
 *
 * `user.online` stays current only on channels queried or watched with `presence: true`. The copy
 * gets the count as both `{{ onlineCount }}` and `{{ watcherCount }}`.
 */
export function useChannelHeaderOnlineStatus({
  channel: channelOverride,
}: UseChannelHeaderOnlineStatusParams = {}): string | null {
  const { t } = useTranslationContext();
  const channel = useResolvedChannel(channelOverride);
  const { activeMemberCount, memberCount, members, watchers } = useStateStore(
    channel.state,
    membersSelector,
  );
  const displayedMemberCount = activeMemberCount ?? memberCount;
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
    return hasOtherMembersOnline
      ? t('common.online.label', 'Online')
      : t('common.offline.label', 'Offline');
  }

  return `${t('channelHeader.online.members.label', '{{ memberCount }} members', { memberCount: displayedMemberCount })} · ${t('channelHeader.online.online.label', '{{ onlineCount }} online', { onlineCount, watcherCount: onlineCount })}`;
}
