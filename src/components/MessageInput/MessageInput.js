import React from 'react';
import MessageInputLarge from './MessageInputLarge';
import SendButton from './SendButton';

const MessageInput = (props) => {
  const { Input } = props;
  return <Input {...props} />;
};

MessageInput.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  Input: MessageInputLarge,
  SendButton,
  additionalTextareaProps: {},
};

export default React.memo(MessageInput);
