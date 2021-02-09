import React from 'react';
import MessageInputLarge from './MessageInputLarge';

const MessageInput = (props) => {
  const { Input } = props;
  return <Input {...props} />;
};

MessageInput.defaultProps = {
  additionalTextareaProps: {},
  disabled: false,
  focus: false,
  grow: true,
  Input: MessageInputLarge,
  maxRows: 10,
  publishTypingEvent: true,
};

export default React.memo(MessageInput);
