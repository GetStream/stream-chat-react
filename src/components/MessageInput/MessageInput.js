import React from 'react';
import MessageInputLarge from './MessageInputLarge';
import SendButton from './SendButton';
import useMessageInputState from './MessageInputState';

const MessageInput = (props) => {
  const messageInputState = useMessageInputState(props);
  const { Input } = props;
  return <Input {...props} {...messageInputState} />;
};

MessageInput.defaultProps = {
  focus: false,
  disabled: false,
  grow: true,
  maxRows: 10,
  Input: MessageInputLarge,
  SendButton,
  additionalTextareaProps: {},
};

export default React.memo(MessageInput);
