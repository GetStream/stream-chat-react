import { useEffect, useState } from 'react';

import { useChatContext } from '../../../../context/ChatContext';

import type { EventPayload, LocalMessage } from 'stream-chat';

export const useGiphyPreview = (separateGiphyPreview: boolean) => {
  const [giphyPreviewMessage, setGiphyPreviewMessage] = useState<LocalMessage>();

  const { client } = useChatContext('useGiphyPreview');

  useEffect(() => {
    if (!separateGiphyPreview) return;
    const handleEvent = (event: EventPayload<'message.new'>) => {
      const { message, user } = event;

      if (message?.command === 'giphy' && user?.id === client.userId) {
        setGiphyPreviewMessage(undefined);
      }
    };

    const subscription = client.on('message.new', handleEvent);
    return () => subscription.unsubscribe();
  }, [client, separateGiphyPreview]);

  return {
    giphyPreviewMessage,
    setGiphyPreviewMessage: separateGiphyPreview ? setGiphyPreviewMessage : undefined,
  };
};
