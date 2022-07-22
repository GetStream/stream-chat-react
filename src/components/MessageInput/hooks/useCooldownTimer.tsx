import React, { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { ChannelResponse } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CooldownTimerProps = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export const CooldownTimer = ({ cooldownInterval, setCooldownRemaining }: CooldownTimerProps) => {
  const [seconds, setSeconds] = useState(cooldownInterval);

  useEffect(() => {
    const countdownInterval = setInterval(() => {
      if (seconds > 0) {
        setSeconds(seconds - 1);
      } else {
        setCooldownRemaining(0);
      }
    }, 1000);

    return () => clearInterval(countdownInterval);
  });

  return (
    <div className='str-chat__message-input-cooldown' data-testid='cooldown-timer'>
      {seconds === 0 ? null : seconds}
    </div>
  );
};

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): CooldownTimerState => {
  const { latestMessageDatesByChannels } = useChatContext<StreamChatGenerics>('useCooldownTimer');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useCooldownTimer');

  const { cooldown: cooldownInterval, own_capabilities } = (channel.data ||
    {}) as ChannelResponse<StreamChatGenerics>;

  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const skipCooldown = !own_capabilities?.includes('slow-mode');

  useEffect(() => {
    const latestMessageDate = latestMessageDatesByChannels[channel.cid];
    if (!cooldownInterval || !latestMessageDate) {
      return;
    }
    const remainingCooldown = Math.round(
      cooldownInterval - (new Date().getTime() - latestMessageDate.getTime()) / 1000,
    );
    if (remainingCooldown > 0 && !skipCooldown) {
      setCooldownRemaining(remainingCooldown);
    }
  }, [channel.id, cooldownInterval, latestMessageDatesByChannels[channel.cid]]);

  return {
    cooldownInterval: cooldownInterval || 0,
    cooldownRemaining,
    setCooldownRemaining,
  };
};
