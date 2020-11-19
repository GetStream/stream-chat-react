import React, { useCallback, useContext, useState } from 'react';
import { ImageDropzone } from 'react-file-utils';
import { logChatPromiseExecution } from 'stream-chat';
import {
  ChannelContext,
  ChatAutoComplete,
  ChatContext,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './TeamMessageInput.css';

import { UploadsPreview } from './UploadsPreview';
import { TeamTypingIndicator } from '../TeamTypingIndicator/TeamTypingIndicator';

import {
  BoldIcon,
  CodeSnippet,
  ItalicsIcon,
  LightningBolt,
  LightningBoltSmall,
  SendButton,
  SmileyFace,
  StrikeThroughIcon,
} from '../../assets';

export const TeamMessageInput = (props) => {
  const {
    acceptedFiles,
    channel,
    maxNumberOfFiles,
    multipleUploads,
    sendMessage,
    thread,
  } = useContext(ChannelContext);
  const { client } = useContext(ChatContext);

  const [boldState, setBoldState] = useState(false);
  const [codeState, setCodeState] = useState(false);
  const [giphyState, setGiphyState] = useState(false);
  const [italicState, setItalicState] = useState(false);
  const [strikeThroughState, setStrikeThroughState] = useState(false);

  const resetIconState = () => {
    setBoldState(false);
    setCodeState(false);
    setItalicState(false);
    setStrikeThroughState(false);
  };

  const getPlaceholder = () => {
    if (channel.type === 'team') {
      return `#${channel.data.id || 'random'}`;
    }

    const members = Object.values(channel.state.members).filter(
      ({ user }) => user.id !== client.userID,
    );

    if (!members.length || members.length === 1) {
      return members[0]?.user.name || 'Johnny Blaze';
    }

    return 'the group';
  };

  const overrideSubmitHandler = (message) => {
    let updatedMessage;

    if (message.attachments.length && message.text.startsWith('/giphy')) {
      const updatedText = message.text.replace('/giphy', '');
      updatedMessage = { ...message, text: updatedText };
    }

    if (giphyState) {
      const updatedText = `/giphy ${message.text}`;
      updatedMessage = { ...message, text: updatedText };
    } else {
      if (boldState) {
        const updatedText = `**${message.text}**`;
        updatedMessage = { ...message, text: updatedText };
      }

      if (codeState) {
        const updatedText = `\`${message.text}\``;
        updatedMessage = { ...message, text: updatedText };
      }

      if (italicState) {
        const updatedText = `*${message.text}*`;
        updatedMessage = { ...message, text: updatedText };
      }

      if (strikeThroughState) {
        const updatedText = `~~${message.text}~~`;
        updatedMessage = { ...message, text: updatedText };
      }
    }

    const sendMessagePromise = sendMessage(updatedMessage || message);
    logChatPromiseExecution(sendMessagePromise, 'send message');

    setGiphyState(false);
    resetIconState();
  };

  const messageInput = useMessageInput({ ...props, overrideSubmitHandler });

  const onChange = useCallback(
    (e) => {
      if (
        messageInput.text.length === 1 &&
        e.nativeEvent?.inputType === 'deleteContentBackward'
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

  const onCommandClick = (e) => {
    e.preventDefault();
    logChatPromiseExecution(channel.keystroke(), 'start typing event');

    messageInput.textareaRef.current.focus();

    const event = new Event('input', { bubbles: true });
    messageInput.textareaRef.current.dispatchEvent(event);

    const newEvent = {
      ...event,
      preventDefault: () => null,
      target: { ...event.target, value: '/' },
    };

    messageInput.handleChange(newEvent);
  };

  const GiphyIcon = () => (
    <div className="giphy-icon__wrapper">
      <LightningBoltSmall />
      <p className="giphy-icon__text">GIPHY</p>
    </div>
  );

  return (
    <div className={`team-message-input__wrapper ${!!thread && 'thread-open'}`}>
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
              commands={messageInput.getCommands()}
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
              <LightningBolt {...{ giphyState, onCommandClick }} />
              <div className="icon-divider"></div>
              <BoldIcon {...{ boldState, resetIconState, setBoldState }} />
              <ItalicsIcon
                {...{ italicState, resetIconState, setItalicState }}
              />
              <StrikeThroughIcon
                {...{
                  resetIconState,
                  strikeThroughState,
                  setStrikeThroughState,
                }}
              />
              <CodeSnippet {...{ codeState, resetIconState, setCodeState }} />
            </div>
          </div>
        </div>
      </ImageDropzone>
      <TeamTypingIndicator type="input" />
      <EmojiPicker {...messageInput} />
    </div>
  );
};
