// @ts-check
import { useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @typedef {import('stream-chat').Message} Message
 * @typedef {import('stream-chat').UpdateMessageAPIResponse} UpdateResponse
 * @param {((cid: string, updatedMessage: Message) => Promise<UpdateResponse>) | undefined} doUpdateMessageRequest
 * @returns {(updatedMessage: Message) => Promise<UpdateResponse>}
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
