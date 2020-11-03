import React from 'react';
import { FileUploadButton } from 'react-file-utils';
import {
  ChatAutoComplete,
  EmojiPicker,
  useMessageInput,
} from 'stream-chat-react';

import './AgentMessageInput.css';

import { FileIcon } from '../../assets/FileIcon';
import { SmileyFace } from '../../assets/SmileyFace';

export const AgentMessageInput = (props) => {
  const messageInput = useMessageInput(props);

  return (
    <div className="agent-message-input__wrapper">
      <div className="agent-message-input__input">
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
      <EmojiPicker {...messageInput} />
    </div>
  );
};
