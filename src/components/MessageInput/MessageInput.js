import React from 'react';
import MessageInputLarge from './MessageInputLarge';

const MessageInput = (props) => {
  const { Input } = props;
  return <Input {...props} />;
};

MessageInput.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  Input: MessageInputLarge,
  maxRows: 10,
  additionalTextareaProps: {},
  keycodeSubmitKeys: null,
};

export default React.memo(MessageInput);
