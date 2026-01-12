import type React from 'react';
import { useEffect, useMemo, useState } from 'react';
import type { ChannelResponse, MessagePaginatorState } from 'stream-chat';

import { useChannelStateContext, useChatContext } from '../../../context';
import { useStateStore } from '../../../store';

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

const messagePaginatorStateSelector = (state: MessagePaginatorState) => ({
  messages: state.items ?? [],
});

export const useCooldownTimer = (): CooldownTimerState => {
  const { client, latestMessageDatesByChannels } = useChatContext('useCooldownTimer');
  const { channel } = useChannelStateContext('useCooldownTimer');
  const { messages } = useStateStore(
    channel.messagePaginator.state,
    messagePaginatorStateSelector,
  );
  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const { cooldown: cooldownInterval = 0, own_capabilities } = (channel.data ||
    {}) as ChannelResponse;

  const skipCooldown = own_capabilities?.includes('skip-slow-mode');

  const ownLatestMessageDate = useMemo(
    () =>
      latestMessageDatesByChannels[channel.cid] ??
      [...messages]
        .sort(
          (a, b) => (b.created_at as Date)?.getTime() - (a.created_at as Date)?.getTime(),
        )
        .find((v) => v.user?.id === client.user?.id)?.created_at,
    [messages, client.user?.id, latestMessageDatesByChannels, channel.cid],
  ) as Date;

  useEffect(() => {
    const timeSinceOwnLastMessage = ownLatestMessageDate
      ? // prevent negative values
        Math.max(0, (new Date().getTime() - ownLatestMessageDate.getTime()) / 1000)
      : undefined;

    const remaining =
      !skipCooldown &&
      typeof timeSinceOwnLastMessage !== 'undefined' &&
      cooldownInterval > timeSinceOwnLastMessage
        ? Math.round(cooldownInterval - timeSinceOwnLastMessage)
        : 0;

    setCooldownRemaining(remaining);

    if (!remaining) return;

    const timeout = setTimeout(() => {
      setCooldownRemaining(0);
    }, remaining * 1000);

    return () => {
      clearTimeout(timeout);
    };
  }, [cooldownInterval, ownLatestMessageDate, skipCooldown]);

  return {
    cooldownInterval,
    cooldownRemaining,
    setCooldownRemaining,
  };
};
