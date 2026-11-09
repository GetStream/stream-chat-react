import { useMessageContext } from 'stream-chat-react';
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
      <strong className='cookbook-message-ui__name'>
        {message.user?.name || message.user?.id}
      </strong>
      <span>{message.text}</span>
    </div>
  );
};
