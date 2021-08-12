import { MessageToSend, useChannelActionContext, useChannelStateContext } from 'stream-chat-react';

type Props = {
  checked: boolean;
};

export const useThreadOverrideSubmit = (props: Props) => {
  const { checked } = props;
  const { sendMessage } = useChannelActionContext();

  const { channel } = useChannelStateContext();

  const threadOverrideSubmitHandler = async (message: MessageToSend) => {
    //@ts-expect-error
    checked && (await channel.sendMessage({ ...message, show_in_channel: true }));
    sendMessage(message);
  };

  return threadOverrideSubmitHandler;
};
