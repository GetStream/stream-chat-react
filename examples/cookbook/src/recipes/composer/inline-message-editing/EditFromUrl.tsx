import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';
import { useInlineEdit } from './InlineEditContext';

/**
 * For the screenshot only, not part of the recipe: `?edit=<message id>` opens the inline editor on
 * that message of the channel (`?channel=`), and `&text=<text>` types the text into the channel's
 * own composer at the bottom. Nothing is sent.
 */
export const EditFromUrl = () => {
  const { client } = useChatContext();
  const { startEditing } = useInlineEdit();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const messageId = params.get('edit');
    const text = params.get('text');
    if (!channelId || !messageId) return;

    const channel = client.channel('messaging', channelId);
    const timer = setInterval(() => {
      const message = channel.messagePaginator.getItem(messageId);
      if (!message || !document.querySelector('.str-chat__channel textarea')) return;
      clearInterval(timer);
      if (text) channel.messageComposer.textComposer.setText(text);
      startEditing(message, false);
    }, 200);

    return () => clearInterval(timer);
  }, [client, startEditing]);

  return null;
};
