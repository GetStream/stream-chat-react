import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { EventHandler } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export const useGiphyPreview = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  separateGiphyPreview: boolean,
) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] = useState<
    StreamMessage<At, Ch, Co, Ev, Me, Re, Us>
  >();

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useGiphyPreview');

  useEffect(() => {
    const handleEvent: EventHandler<At, Ch, Co, Ev, Me, Re, Us> = (event) => {
      const { message, user } = event;

      if (message?.command === 'giphy' && user?.id === client.userID) {
        setGiphyPreviewMessage(undefined);
      }
    };

    if (separateGiphyPreview) client.on('message.new', handleEvent);
    return () => client.off('message.new', handleEvent);
  }, [separateGiphyPreview]);

  return { giphyPreviewMessage, setGiphyPreviewMessage };
};
