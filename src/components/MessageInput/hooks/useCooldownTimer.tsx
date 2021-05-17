import React, { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';

import type { Event } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

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

export type CooldownTimerState = {
  cooldownInterval: number;
  setCooldownRemaining: React.Dispatch<React.SetStateAction<number | undefined>>;
  cooldownRemaining?: number;
};

export const useCooldownTimer = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(): CooldownTimerState => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();
  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  // @ts-expect-error type needs to be added to JS client
  const { cooldown: cooldownInterval } = channel.data || {};

  const [cooldownRemaining, setCooldownRemaining] = useState<number>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.user?.id === client.userID) {
        setCooldownRemaining(cooldownInterval);
      }
    };

    if (cooldownInterval) channel.on('message.new', handleEvent);
    return () => channel.off('message.new', handleEvent);
  }, [channel.id, cooldownInterval]);

  return { cooldownInterval: cooldownInterval || 0, cooldownRemaining, setCooldownRemaining };
};
