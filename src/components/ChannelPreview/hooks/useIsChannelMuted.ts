import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { Channel, Event } from 'stream-chat';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

export const useIsChannelMuted = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  channel: Channel<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [muted, setMuted] = useState(channel.muteStatus());

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (event.type === 'notification.channel_mutes_updated') setMuted(channel.muteStatus());
    };

    if (client) client.on(handleEvent);
    return () => {
      if (client) {
        client.off(handleEvent);
      }
    };
  }, [client, muted]);

  return muted;
};
