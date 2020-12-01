import React, { useCallback, useContext, useState } from 'react';
import { ImageDropzone } from 'react-file-utils';
import { logChatPromiseExecution } from 'stream-chat';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './MessagingInput.css';

import {
  CommandIcon,
  EmojiIcon,
  LightningBoltSmall,
  SendIcon,
} from '../../assets';
import { UploadsPreview } from './UploadsPreview';

const GiphyIcon = () => (
  <div className="giphy-icon__wrapper">
    <LightningBoltSmall />
    <p className="giphy-icon__text">GIPHY</p>
  </div>
);

const MessagingInput = (props) => {
  const {
    acceptedFiles,
    maxNumberOfFiles,
    multipleUploads,
    sendMessage,
  } = useContext(ChannelContext);

  const [giphyState, setGiphyState] = useState(false);

  const overrideSubmitHandler = (message) => {
    let updatedMessage;

    if (message.attachments.length && message.text.startsWith('/giphy')) {
      const updatedText = message.text.replace('/giphy', '');
      updatedMessage = { ...message, text: updatedText };
    }

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
      const { value } = e.target;
      const deletePressed =
        e.nativeEvent?.inputType === 'deleteContentBackward';

      if (messageInput.text.length === 1 && deletePressed) {
        setGiphyState(false);
      }

      if (
        !giphyState &&
        messageInput.text.startsWith('/giphy') &&
        !messageInput.numberOfUploads
      ) {
        e.target.value = value.replace('/giphy', '');
        setGiphyState(true);
      }

      messageInput.handleChange(e);
    },
    [giphyState, messageInput],
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
      <ImageDropzone
        accept={acceptedFiles}
        handleFiles={messageInput.uploadNewFiles}
        multiple={multipleUploads}
        disabled={
          (maxNumberOfFiles !== undefined &&
            messageInput.numberOfUploads >= maxNumberOfFiles) ||
          giphyState
        }
      >
        <div className="messaging-input__input-wrapper">
          {giphyState && !messageInput.numberOfUploads && <GiphyIcon />}
          <UploadsPreview {...messageInput} />
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
        </div>
      </ImageDropzone>
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
