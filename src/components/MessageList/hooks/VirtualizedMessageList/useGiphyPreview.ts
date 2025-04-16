import { useEffect, useState } from 'react';

import { useChatContext } from '../../../../context/ChatContext';

import type { EventHandler, LocalMessage } from 'stream-chat';

export const useGiphyPreview = (separateGiphyPreview: boolean) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] = useState<LocalMessage>();

  const { client } = useChatContext('useGiphyPreview');

  useEffect(() => {
    if (!separateGiphyPreview) return;
    const handleEvent: EventHandler = (event) => {
      const { message, user } = event;

      if (message?.command === 'giphy' && user?.id === client.userID) {
        setGiphyPreviewMessage(undefined);
      }
    };

    client.on('message.new', handleEvent);
    return () => client.off('message.new', handleEvent);
  }, [client, separateGiphyPreview]);

  return {
    giphyPreviewMessage,
    setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
  };
};
