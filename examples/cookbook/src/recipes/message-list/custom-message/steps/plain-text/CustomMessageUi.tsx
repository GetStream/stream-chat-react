import { useMessageContext } from 'stream-chat-react';

export const CustomMessageUi = () => {
  const { message } = useMessageContext();

  return <div>{message.text}</div>;
};
