import React, { useEffect, useMemo, useState } from 'react';
import type { ChannelResponse } from 'stream-chat';

import { useChannelStateContext, useChatContext } from '../../../context';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): CooldownTimerState => {
  const { client, latestMessageDatesByChannels } = useChatContext<StreamChatGenerics>(
    'useCooldownTimer',
  );
  const { channel, messages = [] } = useChannelStateContext<StreamChatGenerics>('useCooldownTimer');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const { cooldown: cooldownInterval = 0, own_capabilities } = (channel.data ||
    {}) as ChannelResponse<StreamChatGenerics>;

  const skipCooldown = own_capabilities?.includes('skip-slow-mode');

  const ownLatestMessageDate = useMemo(
    () =>
      latestMessageDatesByChannels[channel.cid] ??
      [...messages]
        .sort((a, b) => (b.created_at as Date)?.getTime() - (a.created_at as Date)?.getTime())
        .find((v) => v.user?.id === client.user?.id)?.created_at,
    [messages, client.user?.id, latestMessageDatesByChannels, channel.cid],
  ) as Date;

  useEffect(() => {
    const timeSinceOwnLastMessage = ownLatestMessageDate
      ? // prevent negative values
        Math.max(0, (new Date().getTime() - ownLatestMessageDate.getTime()) / 1000)
      : undefined;

    setCooldownRemaining(
      !skipCooldown &&
        typeof timeSinceOwnLastMessage !== 'undefined' &&
        cooldownInterval > timeSinceOwnLastMessage
        ? Math.round(cooldownInterval - timeSinceOwnLastMessage)
        : 0,
    );
  }, [cooldownInterval, ownLatestMessageDate, skipCooldown]);

  return {
    cooldownInterval,
    cooldownRemaining,
    setCooldownRemaining,
  };
};
