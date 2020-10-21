import React, { useCallback, useContext, useState } from 'react';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './ThreadMessageInput.css';

import { LightningBolt } from '../../assets/LightningBolt';
import { SendButton } from '../../assets/SendButton';
import { SmileyFace } from '../../assets/SmileyFace';

export const ThreadMessageInput = (props) => {
  const { channel } = useContext(ChannelContext);
  const messageInput = useMessageInput(props);

  const [giphyState, setGiphyState] = useState(false);

  // const setGiphy = useCallback(() => {}, []);

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

  // const onClickCommand = () => {
  //   messageInput.textareaRef.current.focus();
  //   messageInput.handleChange({
  //     target: { value: '/' },
  //     preventDefault: () => null,
  //   });
  // };

  return (
    <div className="thread-message-input__wrapper">
      <div className="thread-message-input__input">
        <ChatAutoComplete
          commands={messageInput.getCommands()}
          innerRef={messageInput.textareaRef}
          handleSubmit={messageInput.handleSubmit}
          onSelectItem={messageInput.onSelectItem}
          onChange={onChange}
          value={messageInput.text}
          rows={1}
          maxRows={props.maxRows}
          placeholder="Reply"
          onPaste={messageInput.onPaste}
          triggers={props.autocompleteTriggers}
          grow={props.grow}
          disabled={props.disabled}
          additionalTextareaProps={{
            ...props.additionalTextareaProps,
          }}
        />
        <div className="thread-message-input__icons">
          <SmileyFace openEmojiPicker={messageInput.openEmojiPicker} />
          <LightningBolt />
        </div>
        <div
          className="thread-message-input__button"
          role="button"
          aria-roledescription="button"
          onClick={messageInput.handleSubmit}
        >
          <SendButton />
        </div>
      </div>
      <EmojiPicker {...messageInput} />
    </div>
  );
};
