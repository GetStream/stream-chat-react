import React, { useCallback, useContext, useState } from 'react';
import { logChatPromiseExecution } from 'stream-chat';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './ThreadMessageInput.css';

import {
  // LightningBolt,
  LightningBoltSmall,
  SendButton,
  SmileyFace,
} from '../../assets';

export const ThreadMessageInput = (props) => {
  const { sendMessage } = useContext(ChannelContext);
  const [giphyState, setGiphyState] = useState(false);

  const overrideSubmitHandler = (message) => {
    let updatedMessage;

    if (giphyState) {
      const updatedText = `/giphy ${message.text}`;
      updatedMessage = { ...message, text: updatedText };
    }

    const sendMessagePromise = sendMessage(updatedMessage || message);
    logChatPromiseExecution(sendMessagePromise, 'send message');
    setGiphyState(false);
  };

  const messageInput = useMessageInput({ ...props, overrideSubmitHandler });

  const onChange = useCallback(
    (e) => {
      if (
        messageInput.text.length === 1 &&
        e.nativeEvent.inputType === 'deleteContentBackward'
      ) {
        setGiphyState(false);
      }

      if (messageInput.text.startsWith('/giphy') && !giphyState) {
        e.target.value = e.target.value.replace('/giphy', '');
        setGiphyState(true);
      }

      messageInput.handleChange(e);
    },
    [giphyState, messageInput],
  );

  const GiphyIcon = () => (
    <div className="giphy-icon__wrapper">
      <LightningBoltSmall />
      <p className="giphy-icon__text">GIPHY</p>
    </div>
  );

  return (
    <div className="thread-message-input__wrapper">
      <div className="thread-message-input__input">
        {giphyState && <GiphyIcon />}
        <ChatAutoComplete
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
          {/* <LightningBolt {...{ giphyState }} /> */}
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
