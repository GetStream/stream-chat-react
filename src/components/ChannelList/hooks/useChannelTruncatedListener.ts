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
} from '../../../types/types';

export const useChannelTruncatedListener = <
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
  forceUpdate?: () => void,
) => {
  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useChannelTruncatedListener');

  useEffect(() => {
    const handleEvent = (event: Event<At, Ch, Co, Ev, Me, Re, Us>) => {
      setChannels((channels) => [...channels]);

      if (customHandler && typeof customHandler === 'function') {
        customHandler(setChannels, event);
      }
      if (forceUpdate) {
        forceUpdate();
      }
    };

    client.on('channel.truncated', handleEvent);

    return () => {
      client.off('channel.truncated', handleEvent);
    };
  }, [customHandler]);
};
