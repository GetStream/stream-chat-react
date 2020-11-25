import React, { useContext } from 'react';
import { FileUploadButton, ImageDropzone } from 'react-file-utils';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './AgentMessageInput.css';

import { UploadsPreview } from './UploadsPreview';

import { FileIcon, SmileyFace } from '../../assets';

export const AgentMessageInput = (props) => {
  const messageInput = useMessageInput(props);

  const { acceptedFiles, maxNumberOfFiles, multipleUploads } = useContext(
    ChannelContext,
  );

  return (
    <div className="agent-message-input__wrapper">
      <ImageDropzone
        accept={acceptedFiles}
        handleFiles={messageInput.uploadNewFiles}
        multiple={multipleUploads}
        disabled={
          maxNumberOfFiles !== undefined &&
          messageInput.numberOfUploads >= maxNumberOfFiles
        }
      >
        <div className="agent-message-input__input">
          <UploadsPreview {...messageInput} />
          <div className="agent-message-input__input-wrapper">
            <ChatAutoComplete
              commands={messageInput.getCommands()}
              innerRef={messageInput.textareaRef}
              handleSubmit={messageInput.handleSubmit}
              onSelectItem={messageInput.onSelectItem}
              onChange={messageInput.handleChange}
              value={messageInput.text}
              rows={1}
              maxRows={props.maxRows}
              placeholder="Send a message"
              onPaste={messageInput.onPaste}
              triggers={props.autocompleteTriggers}
              grow={props.grow}
              disabled={props.disabled}
              additionalTextareaProps={{
                ...props.additionalTextareaProps,
              }}
            />
            <SmileyFace openEmojiPicker={messageInput.openEmojiPicker} />
            <FileUploadButton handleFiles={messageInput.uploadNewFiles}>
              <FileIcon />
            </FileUploadButton>
          </div>
        </div>
      </ImageDropzone>
      <EmojiPicker {...messageInput} />
    </div>
  );
};
