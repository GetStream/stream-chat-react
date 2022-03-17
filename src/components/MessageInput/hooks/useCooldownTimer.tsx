import React, { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { ChannelResponse, Event } from 'stream-chat';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type CooldownTimerProps = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
};

export const CooldownTimer: React.FC<CooldownTimerProps> = (props) => {
  const { cooldownInterval, setCooldownRemaining } = props;

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

  return <div>{seconds === 0 ? null : seconds}</div>;
};

const rolesToSkip: Record<string, boolean> = {
  admin: true,
  channel_moderator: true,
  moderator: true,
};

const checkUserRoles = (globalRole: string, channelRole: string) => {
  const skipGlobal = !!rolesToSkip[globalRole];
  const skipChannel = !!rolesToSkip[channelRole];
  return skipGlobal || skipChannel;
};

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): CooldownTimerState => {
  const { client } = useChatContext<StreamChatGenerics>('useCooldownTimer');
  const { channel } = useChannelStateContext<StreamChatGenerics>('useCooldownTimer');

  const { cooldown: cooldownInterval } = (channel.data ||
    {}) as ChannelResponse<StreamChatGenerics>;

  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  const globalRole = client.user?.role || '';
  const channelRole = channel.state.members[client.userID || '']?.role || '';

  const skipCooldown = checkUserRoles(globalRole, channelRole);

  useEffect(() => {
    const handleEvent = (event: Event<StreamChatGenerics>) => {
      if (!skipCooldown && event.user?.id === client.userID) {
        setCooldownRemaining(cooldownInterval);
      }
    };

    if (cooldownInterval) channel.on('message.new', handleEvent);
    return () => channel.off('message.new', handleEvent);
  }, [channel.id, cooldownInterval]);

  return { cooldownInterval: cooldownInterval || 0, cooldownRemaining, setCooldownRemaining };
};
