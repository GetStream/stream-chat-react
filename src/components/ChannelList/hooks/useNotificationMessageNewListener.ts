import { useEffect } from 'react';
import uniqBy from 'lodash.uniqby';

import { getChannel } from '../utils';

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

export const useNotificationMessageNewListener = <
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
    const handleEvent = async (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      // if new message, put move channel up
      // get channel if not in state currently
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (event.channel?.type) {
        const channel = await getChannel(
          client,
          event.channel.type,
          event.channel.id,
        );
        // move channel to starting position
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.message_new', handleEvent);

    return () => {
      client.off('notification.message_new', handleEvent);
    };
  }, [customHandler]);
};
