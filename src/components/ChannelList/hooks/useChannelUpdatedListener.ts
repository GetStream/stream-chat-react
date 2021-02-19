import { useEffect } from 'react';

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

export const useChannelUpdatedListener = <
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
  customHandler?: (
    setChannels: React.Dispatch<
      React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>
    >,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void,
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      setChannels((channels) => {
        const channelIndex = channels.findIndex(
          (channel) => channel.cid === event.channel?.cid,
        );

        if (channelIndex > -1 && event.channel) {
          const newChannels = channels;
          newChannels[channelIndex].data = event.channel;
          return [...newChannels];
        }

        return channels;
      });
      if (forceUpdate) {
        forceUpdate();
      }
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
    };

    client.on('channel.updated', handleEvent);

    return () => {
      client.off('channel.updated', handleEvent);
    };
  }, [customHandler]);
};
