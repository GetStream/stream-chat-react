import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshot only, not part of the recipe: `?quote=<message id>&text=<text>` quotes that
 * message in the channel's composer (`?channel=`) and types the text, without sending anything.
 */
export const PrefillComposer = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const quoteId = params.get('quote');
    const text = params.get('text');
    if (!channelId || (!quoteId && !text)) return;

    const channel = client.channel('messaging', channelId);
    const timer = setInterval(() => {
      const quoted = quoteId ? channel.messagePaginator.getItem(quoteId) : undefined;
      if (quoteId && !quoted) return;
      clearInterval(timer);
      if (quoted) channel.messageComposer.setQuotedMessage(quoted);
      if (text) channel.messageComposer.textComposer.setText(text);
    }, 200);

    return () => clearInterval(timer);
  }, [client]);

  return null;
};
