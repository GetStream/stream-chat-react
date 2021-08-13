import { MessageToSend, useChannelActionContext } from 'stream-chat-react';

import { useGiphyContext } from '../contexts/GiphyContext';

export const useOverrideSubmit = (showInChannel?: boolean) => {
  const { sendMessage } = useChannelActionContext();
  const { giphyState, setGiphyState } = useGiphyContext();

  const overrideSubmitHandler = async (message: MessageToSend) => {
    let updatedMessage;

    if (message.attachments?.length && message.text?.startsWith('/giphy')) {
      const updatedText = message.text.replace('/giphy', '');
      updatedMessage = { ...message, text: updatedText };
    }

    if (giphyState) {
      const updatedText = `/giphy ${message.text}`;
      updatedMessage = { ...message, text: updatedText };
    }

    const messageToSend = updatedMessage || message;

    try {
      await sendMessage(messageToSend, { show_in_channel: showInChannel });
    } catch (err) {
      console.log(err);
    }

    setGiphyState(false);
  };

  return overrideSubmitHandler;
};
