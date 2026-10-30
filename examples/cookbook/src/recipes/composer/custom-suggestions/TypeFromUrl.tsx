import { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react';

/**
 * For the screenshots only, not part of the recipe: `?type=<text>` types the text into the
 * channel's composer (`?channel=`), the way a keystroke does, so its suggestions open. Nothing is
 * sent.
 */
export const TypeFromUrl = () => {
  const { client } = useChatContext();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const channelId = params.get('channel');
    const text = params.get('type');
    if (!channelId || !text) return;

    const timer = setInterval(() => {
      const textarea = document.querySelector<HTMLTextAreaElement>(
        '.str-chat__channel textarea',
      );
      if (!textarea) return;
      clearInterval(timer);
      textarea.focus();
      void client
        .channel('messaging', channelId)
        .messageComposer.textComposer.handleChange({
          selection: { end: text.length, start: text.length },
          text,
        });
    }, 200);

    return () => clearInterval(timer);
  }, [client]);

  return null;
};
