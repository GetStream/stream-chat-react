// @ts-check
import { useContext } from 'react';
import { ChatContext } from '../../../context';

/**
 * @type {import('types').useEditMessageHandler}
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
