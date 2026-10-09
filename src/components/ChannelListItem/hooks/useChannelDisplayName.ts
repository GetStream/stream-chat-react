import { useMemo } from 'react';
import type { Channel } from 'stream-chat';

import { useChatContext } from '../../../context';
import { useTranslationContext } from '../../../context/TranslationContext';
import { useStateStore } from '../../../store';
import {
  channelDisplayStateSelector,
  deriveChannelDisplayName,
} from '../channelDisplayState';

/**
 * Channel display name with translation context.
 * 1. channel.data.custom.name
 * 2. DM (exactly 2 members): other member's name, then translated "Direct message"
 * 3. Group (3+ members): comma-separated list of 2 other members' names (no ellipsis)
 * 4. undefined otherwise
 *
 * Re-derived from the channel's `data` and `members`, so it changes only when this channel does:
 * an updated user reaches it through the member the client replaces.
 */
export const useChannelDisplayName = (
  channel: Channel | undefined,
): string | undefined => {
  const { client } = useChatContext();
  const { t } = useTranslationContext();
  const directMessageLabel = t(
    'channelListItem.channelDisplayName.directMessage.label',
    'Direct message',
  );
  const displayState = useStateStore(channel?.state, channelDisplayStateSelector);
  const currentUserId = client.userID ?? undefined;

  return useMemo(
    () =>
      displayState
        ? deriveChannelDisplayName(displayState, directMessageLabel, currentUserId)
        : undefined,
    [currentUserId, directMessageLabel, displayState],
  );
};
