import React, { useCallback, useContext, useState } from 'react';
import { ImageDropzone } from 'react-file-utils';
import { logChatPromiseExecution } from 'stream-chat';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './TeamMessageInput.css';

import { UploadsPreview } from './UploadsPreview';
import { TeamTypingIndicator } from '../TeamTypingIndicator/TeamTypingIndicator';

import { BoldIcon } from '../../assets/BoldIcon';
import { CodeSnippet } from '../../assets/CodeSnippet';
import { ItalicsIcon } from '../../assets/ItalicsIcon';
import { LightningBolt } from '../../assets/LightningBolt';
import { LightningBoltSmall } from '../../assets/LightningBoltSmall';
import { SendButton } from '../../assets/SendButton';
import { SmileyFace } from '../../assets/SmileyFace';
import { StrikeThroughIcon } from '../../assets/StrikeThroughIcon';

export const TeamMessageInput = (props) => {
  const {
    acceptedFiles,
    channel,
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

  const getPlaceholder = () => {
    if (channel.type === 'team') {
      return `#${channel.data.id || 'random'}`;
    }

    const members = Object.values(channel.state.members);
    return members[0]?.user.name || 'Johnny Blaze';
  };

  const onChange = useCallback(
    (e) => {
      if (
        messageInput.text.length === 1 &&
        e.nativeEvent.inputType === 'deleteContentBackward'
      ) {
        setGiphyState(false);
      }

      if (
        !giphyState &&
        messageInput.text.startsWith('/giphy') &&
        !messageInput.numberOfUploads
      ) {
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
    <div className="team-message-input__wrapper">
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
        <div className="team-message-input__input">
          <div className="team-message-input__top">
            {giphyState && !messageInput.numberOfUploads && <GiphyIcon />}
            <UploadsPreview {...messageInput} />
            <ChatAutoComplete
              innerRef={messageInput.textareaRef}
              handleSubmit={messageInput.handleSubmit}
              onSelectItem={messageInput.onSelectItem}
              onChange={onChange}
              value={messageInput.text}
              rows={1}
              maxRows={props.maxRows}
              placeholder={`Message ${getPlaceholder()}`}
              onPaste={messageInput.onPaste}
              triggers={props.autocompleteTriggers}
              grow={props.grow}
              disabled={props.disabled}
              additionalTextareaProps={{
                ...props.additionalTextareaProps,
              }}
            />
            <div
              className="team-message-input__button"
              role="button"
              aria-roledescription="button"
              onClick={messageInput.handleSubmit}
            >
              <SendButton />
            </div>
          </div>
          <div className="team-message-input__bottom">
            <div className="team-message-input__icons">
              <SmileyFace openEmojiPicker={messageInput.openEmojiPicker} />
              <LightningBolt />
              <div className="icon-divider"></div>
              <BoldIcon />
              <ItalicsIcon />
              <StrikeThroughIcon />
              <CodeSnippet />
            </div>
          </div>
        </div>
        <EmojiPicker {...messageInput} />
        <TeamTypingIndicator type="input" />
      </ImageDropzone>
    </div>
  );
};
