import { useEffect, useState } from 'react';
import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useTranslationContext } from '../../../context/TranslationContext';

/**
 * 1. channel.data.name
 * 2. DM (exactly 2 members): other member's name, then directMessageLabel
 * 3. Group (3+ members): comma-separated list of 2 other members' names (no ellipsis)
 * 4. undefined otherwise
 */
function computeChannelDisplayName(
  channel: Channel,
  directMessageLabel: string,
): string | undefined {
  const data = channel.data as { name?: string } | undefined;
  if (data?.name && typeof data.name === 'string') return data.name;

  const memberList = Object.values(channel.state.members);
  const currentUserId = channel.getClient().userID ?? undefined;
  const otherMembers = memberList.filter((m) => m.user?.id !== currentUserId);

  if (memberList.length === 2 && otherMembers.length === 1) {
    const name = otherMembers[0].user?.name;
    return name || directMessageLabel;
  }
  if (otherMembers.length >= 2) {
    const names = otherMembers
      .map((m) => m.user?.name)
      .filter(Boolean)
      .slice(0, 2) as string[];
    if (names.length > 0) return names.join(', ');
  }
  return undefined;
}

/**
 * Channel display name with translation context.
 * 1. channel.data.name
 * 2. DM (exactly 2 members): other member's name, then translated "Direct message"
 * 3. Group (3+ members): comma-separated list of 2 other members' names (no ellipsis)
 * 4. undefined otherwise
 */
export const useChannelDisplayName = (
  channel: Channel | undefined,
): string | undefined => {
  const { client } = useChatContext('useChannelDisplayName');
  const { t } = useTranslationContext('useChannelDisplayName');
  const directMessageLabel = t('Direct message');

  const [displayName, setDisplayName] = useState<string | undefined>(() =>
    channel ? computeChannelDisplayName(channel, directMessageLabel) : undefined,
  );

  useEffect(() => {
    if (!channel) {
      setDisplayName(undefined);
      return;
    }
    const updateDisplayName = () =>
      setDisplayName(computeChannelDisplayName(channel, directMessageLabel));
    updateDisplayName();
    client.on('user.updated', updateDisplayName);
    return () => {
      client.off('user.updated', updateDisplayName);
    };
  }, [channel, channel?.data, client, directMessageLabel]);

  return displayName;
};
