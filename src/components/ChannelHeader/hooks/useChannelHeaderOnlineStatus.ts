import { useEffect, useState } from 'react';
import type { ChannelState } from 'stream-chat';

import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useChatContext } from '../../../context/ChatContext';
import { useTranslationContext } from '../../../context/TranslationContext';

/**
 * Returns the channel header online status text (e.g. "Online", "Offline", or "X members, Y online").
 * Returns null when the channel has no members (nothing to show).
 */
export function useChannelHeaderOnlineStatus(): string | null {
  const { t } = useTranslationContext();
  const { client } = useChatContext();
  const { channel, watcherCount = 0 } = useChannelStateContext();
  const { member_count: memberCount = 0 } = channel?.data || {};

  // todo: we need reactive state for watchers in LLC
  const [watchers, setWatchers] = useState<ChannelState['watchers']>(() =>
    Object.assign({}, channel?.state?.watchers ?? {}),
  );

  useEffect(() => {
    if (!channel) return;
    const subscription = channel.on('user.watching.start', (event) => {
      setWatchers((prev) => {
        if (!event.user?.id) return prev;
        if (prev[event.user.id]) return prev;
        return Object.assign({ [event.user.id]: event.user }, prev);
      });
    });
    return () => subscription.unsubscribe();
  }, [channel]);

  if (!memberCount) return null;

  const isDmChannel =
    memberCount === 1 ||
    (memberCount === 2 &&
      Object.values(channel?.state?.members ?? {}).some(
        ({ user }) => user?.id === client.user?.id,
      ));

  if (isDmChannel) {
    const hasWatchers = Object.keys(watchers).length > 0;
    return hasWatchers ? t('Online') : t('Offline');
  }

  return `${t('{{ memberCount }} members', { memberCount })}, ${t('{{ watcherCount }} online', { watcherCount })}`;
}
