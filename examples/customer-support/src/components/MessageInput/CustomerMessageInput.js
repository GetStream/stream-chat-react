import React, { useContext, useEffect } from 'react';
import { ImageDropzone, FileUploadButton } from 'react-file-utils';
import {
  ChannelContext,
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './CustomerMessageInput.css';

import { UploadsPreview } from './UploadsPreview';

import { FileIcon, SmileyFace } from '../../assets';

export const CustomerMessageInput = (props) => {
  const { open, setOpen } = props;

  const messageInput = useMessageInput(props);

  const { acceptedFiles, maxNumberOfFiles, multipleUploads } = useContext(
    ChannelContext,
  );

  useEffect(() => {
    if (open) {
      messageInput.textareaRef.current.focus();
    } else {
      messageInput.textareaRef.current.blur();
    }
  }, [messageInput.textareaRef, open]);

  useEffect(() => {
    if (messageInput.text) {
      setOpen(true);
    }
  }, [messageInput.text, setOpen]);

  return (
    <div className="support-message-input__wrapper">
      <ImageDropzone
        accept={acceptedFiles}
        handleFiles={messageInput.uploadNewFiles}
        multiple={multipleUploads}
        disabled={
          maxNumberOfFiles !== undefined &&
          messageInput.numberOfUploads >= maxNumberOfFiles
        }
      >
        <div className="support-message-input__input">
          <UploadsPreview {...messageInput} />
          <div className="support-message-input__input-wrapper">
            <ChatAutoComplete
              commands={messageInput.getCommands()}
              innerRef={messageInput.textareaRef}
              handleSubmit={messageInput.handleSubmit}
              onSelectItem={messageInput.onSelectItem}
              onChange={messageInput.handleChange}
              value={messageInput.text}
              rows={1}
              maxRows={props.maxRows}
              placeholder="Ask us a question"
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
