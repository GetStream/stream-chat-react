import { Avatar, MessageText, useMessageContext } from 'stream-chat-react';
import './CustomMessageUi.css';

export const CustomMessageUi = () => {
  const { isMyMessage, message } = useMessageContext();

  const messageUiClassNames = ['cookbook-message-ui'];

  if (isMyMessage()) {
    messageUiClassNames.push('cookbook-message-ui--mine');
  } else {
    messageUiClassNames.push('cookbook-message-ui--other');
  }

  return (
    <div className={messageUiClassNames.join(' ')}>
      <Avatar
        className='cookbook-message-ui__avatar'
        imageUrl={message.user?.image}
        size='md'
        userName={message.user?.name || message.user?.id}
      />
      <div className='cookbook-message-ui__text'>
        <MessageText />
      </div>
    </div>
  );
};
