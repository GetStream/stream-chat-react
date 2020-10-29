import React, { useEffect } from 'react';
import { FileUploadButton } from 'react-file-utils';
import {
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './SupportMessageInput.css';

import { FileIcon } from '../../assets/FileIcon';
import { SmileyFace } from '../../assets/SmileyFace';

export const SupportMessageInput = (props) => {
  const { open, setOpen } = props;
  const messageInput = useMessageInput(props);
  console.log('SupportMessageInput -> messageInput', messageInput);

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
      <div className="support-message-input__input">
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
      <EmojiPicker {...messageInput} />
    </div>
  );
};
