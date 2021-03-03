import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { moveChannelUp } from '../utils';

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
  UnknownType,
} from '../../../../types/types';

export const useMessageNewListener = <
  At extends UnknownType = DefaultAttachmentType,
  Ch extends UnknownType = DefaultChannelType,
  Co extends string = DefaultCommandType,
  Ev extends UnknownType = DefaultEventType,
  Me extends UnknownType = DefaultMessageType,
  Re extends UnknownType = DefaultReactionType,
  Us extends UnknownType = DefaultUserType
>(
  setChannels: React.Dispatch<
    React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
  >,
  lockChannelOrder = false,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      setChannels((channels) => {
        const channelInList =
          channels.filter((channel) => channel.cid === event.cid).length > 0;

        if (
          !channelInList &&
          allowNewMessagesFromUnfilteredChannels &&
          event.channel_type
        ) {
          const channel = client.channel(event.channel_type, event.channel_id);
          return uniqBy([channel, ...channels], 'cid');
        }

        if (!lockChannelOrder) return moveChannelUp(event.cid || '', channels);

        return channels;
      });
    };

    client.on('message.new', handleEvent);

    return () => {
      client.off('message.new', handleEvent);
    };
  }, [lockChannelOrder]);
};
