import React, { useEffect, useMemo, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): CooldownTimerState => {
  const { latestMessageDatesByChannels } = useChatContext<StreamChatGenerics>('useCooldownTimer');
  const { channel, messages = [] } = useChannelStateContext<StreamChatGenerics>('useCooldownTimer');
  const { client } = useChatContext<StreamChatGenerics>('useCooldownTimer');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const { cooldown: cooldownInterval, own_capabilities } = (channel.data ||
    {}) as ChannelResponse<StreamChatGenerics>;

  const skipCooldown = !own_capabilities?.includes('slow-mode');

  const ownLatestMessageDate = useMemo(
    () =>
      latestMessageDatesByChannels[channel.cid] ??
      [...messages]
        .sort((a, b) => (b.created_at as Date)?.getTime() - (a.created_at as Date)?.getTime())
        .find((v) => v.user?.id === client.user?.id)?.created_at,
    [messages, client.user?.id, latestMessageDatesByChannels, channel.cid],
  ) as Date;

  useEffect(() => {
    if (skipCooldown || !cooldownInterval || !ownLatestMessageDate) return;

    const remainingCooldown = Math.round(
      cooldownInterval - (new Date().getTime() - ownLatestMessageDate.getTime()) / 1000,
    );

    if (remainingCooldown > 0) setCooldownRemaining(remainingCooldown);
  }, [cooldownInterval, ownLatestMessageDate, skipCooldown]);

  return {
    cooldownInterval: cooldownInterval ?? 0,
    cooldownRemaining,
    setCooldownRemaining,
  };
};
