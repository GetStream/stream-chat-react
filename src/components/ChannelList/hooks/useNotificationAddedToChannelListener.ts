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
} from '../../../types/types';

export const useNotificationAddedToChannelListener = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
  customHandler?: (
    setChannels: React.Dispatch<React.SetStateAction<Array<Channel<At, Ch, Co, Ev, Me, Re, Us>>>>,
    event: Event<At, Ch, Co, Ev, Me, Re, Us>,
  ) => void,
  allowNewMessagesFromUnfilteredChannels = true,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>();

  useEffect(() => {
    const handleEvent = async (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      } else if (allowNewMessagesFromUnfilteredChannels && event.channel?.type) {
        const channel = await getChannel(client, event.channel.type, event.channel.id);
        setChannels((channels) => uniqBy([channel, ...channels], 'cid'));
      }
    };

    client.on('notification.added_to_channel', handleEvent);

    return () => {
      client.off('notification.added_to_channel', handleEvent);
    };
  }, [customHandler]);
};
