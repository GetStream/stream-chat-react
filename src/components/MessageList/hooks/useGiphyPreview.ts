import { useEffect, useState } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { EventHandler } from 'stream-chat';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export const useGiphyPreview = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  separateGiphyPreview: boolean,
) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] = useState<
    StreamMessage<StreamChatGenerics>
  >();

  const { client } = useChatContext<StreamChatGenerics>('useGiphyPreview');

  useEffect(() => {
    const handleEvent: EventHandler<StreamChatGenerics> = (event) => {
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
