import { Message } from 'stream-chat';
import { MessageToSend, useChannelStateContext } from 'stream-chat-react';

type Props = {
  checked: boolean;
};

export const useThreadOverrideSubmit = (props: Props) => {
  const { checked } = props;

  const { channel } = useChannelStateContext();

  const threadOverrideSubmitHandler = async (message: MessageToSend) => {
    const mentionIDs = message.mentioned_users?.map(({ id }) => id);

    const updatedMessage: Message = {
      ...message,
      mentioned_users: mentionIDs,
      parent_id: message.parent?.id,
      show_in_channel: checked,
    };

    await channel.sendMessage(updatedMessage);
  };

  return threadOverrideSubmitHandler;
};
