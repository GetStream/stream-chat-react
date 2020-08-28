// @ts-check
import { useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Message} Message
 * @typedef {ReturnType<import('stream-chat').StreamChat['updateMessage']>} UpdateMessagePromise
 * @param {((cid: string, updatedMessage: Message) => UpdateMessagePromise) | undefined} doUpdateMessageRequest
 * @returns {(updatedMessage: Message) => UpdateMessagePromise}
 */
const useEditMessageHandler = (doUpdateMessageRequest) => {
  const { channel, client } = useContext(ChatContext);
  return (updatedMessage) => {
    if (doUpdateMessageRequest && channel) {
      return Promise.resolve(
        doUpdateMessageRequest(channel.cid, updatedMessage),
      );
    }
    return client.updateMessage(updatedMessage);
  };
};

export default useEditMessageHandler;
