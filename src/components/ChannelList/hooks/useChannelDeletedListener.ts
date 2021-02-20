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

export const useChannelDeletedListener = <
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
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else {
        setChannels((channels) => {
          const channelIndex = channels.findIndex(
            (channel) => channel.cid === event.cid,
          );

          if (channelIndex < 0) return [...channels];

          // Remove the deleted channel from the list.s
          channels.splice(channelIndex, 1);

          return [...channels];
        });
      }
    };

    client.on('channel.deleted', handleEvent);

    return () => {
      client.off('channel.deleted', handleEvent);
    };
  }, [customHandler]);
};
