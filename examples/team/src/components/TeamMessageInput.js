import React, { useCallback, useContext, useState } from 'react';
import {
  useMessageInput,
  ChatAutoComplete,
  EmojiPicker,
  TranslationContext,
} from 'stream-chat-react';

import './TeamMessageInput.css';

import { SendButton } from '../assets/SendButton';

export const TeamMessageInput = (props) => {
  const messageInput = useMessageInput(props);
  const [giphyState, setGiphyState] = useState(false);
  const { t } = useContext(TranslationContext);

  const setGiphy = useCallback(() => {}, []);

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
    <div className="team-message-input__wrapper">
      <div className="team-message-input__inner">
        <div className="team-message-input__top">
          <ChatAutoComplete
            commands={messageInput.getCommands()}
            innerRef={messageInput.textareaRef}
            handleSubmit={messageInput.handleSubmit}
            onSelectItem={messageInput.onSelectItem}
            onChange={onChange}
            value={messageInput.text}
            rows={1}
            maxRows={props.maxRows}
            placeholder={t('Type your message')}
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
        <EmojiPicker {...messageInput} />
      </div>
    </div>
  );
};
