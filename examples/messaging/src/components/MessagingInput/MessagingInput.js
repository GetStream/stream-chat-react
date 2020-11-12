import React, { useCallback, useState } from 'react';
import {
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './MessagingInput.css';

import { CommandIcon, EmojiIcon, SendIcon } from '../../assets';

const MessagingInput = (props) => {
  const messageInput = useMessageInput(props);

  const [giphyState, setGiphyState] = useState(false);
  console.log('MessagingInput -> giphyState', giphyState);

  const onChange = useCallback(
    (e) => {
      if (messageInput.text.startsWith('/giphy')) {
        setGiphyState(true);
      } else {
        setGiphyState(false);
      }
      messageInput.handleChange(e);
    },
    [messageInput],
  );

  const onClickCommand = () => {
    messageInput.textareaRef.current.focus();
    messageInput.handleChange({
      target: { value: '/' },
      preventDefault: () => null,
    });
  };

  return (
    <div className="str-chat__messaging-input">
      <div
        className="messaging-input__button"
        role="button"
        aria-roledescription="button"
        onClick={messageInput.openEmojiPicker}
        ref={messageInput.emojiPickerRef}
      >
        <EmojiIcon />
      </div>
      <div
        className="messaging-input__button"
        role="button"
        aria-roledescription="button"
        onClick={onClickCommand}
      >
        <CommandIcon />
      </div>
      <ChatAutoComplete
        commands={messageInput.getCommands()}
        innerRef={messageInput.textareaRef}
        handleSubmit={messageInput.handleSubmit}
        onSelectItem={messageInput.onSelectItem}
        onChange={onChange}
        value={messageInput.text}
        rows={1}
        maxRows={props.maxRows}
        placeholder="Send a message"
        onPaste={messageInput.onPaste}
        triggers={props.autocompleteTriggers}
        grow={props.grow}
        disabled={props.disabled}
        additionalTextareaProps={props.additionalTextareaProps}
      />
      <div
        className="messaging-input__button"
        role="button"
        aria-roledescription="button"
        onClick={messageInput.handleSubmit}
      >
        <SendIcon />
      </div>
      <EmojiPicker {...messageInput} />
    </div>
  );
};

export default React.memo(MessagingInput);
