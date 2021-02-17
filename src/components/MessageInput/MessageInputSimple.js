// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import { Tooltip } from '../Tooltip';
import useMessageInput from './hooks/messageInput';
import EmojiPicker from './EmojiPicker';
import DefaultSendButton, { EmojiIconLarge as DefaultEmojiIcon } from './icons';

/** @type {React.FC<import("types").MessageInputProps>} */
const MessageInputSimple = (props) => {
  const {
    EmojiIcon = DefaultEmojiIcon,
    SendButton = DefaultSendButton,
  } = props;

  const { t } = useContext(TranslationContext);

  const messageInput = useMessageInput(props);

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <div className='str-chat__input-flat-wrapper'>
        <div className='str-chat__input-flat--textarea-wrapper'>
          <ChatAutoComplete
            additionalTextareaProps={props.additionalTextareaProps}
            commands={messageInput.getCommands()}
            disabled={props.disabled}
            disableMentions={props.disableMentions}
            grow={props.grow}
            handleSubmit={messageInput.handleSubmit}
            innerRef={messageInput.textareaRef}
            maxRows={props.maxRows}
            onChange={messageInput.handleChange}
            onPaste={messageInput.onPaste}
            onSelectItem={messageInput.onSelectItem}
            placeholder={t('Type your message')}
            rows={1}
            SuggestionList={props.SuggestionList}
            triggers={props.autocompleteTriggers}
            value={messageInput.text}
          />

          <div className='str-chat__emojiselect-wrapper'>
            <Tooltip>{t('Open emoji picker')}</Tooltip>
            <span
              className='str-chat__input-flat-emojiselect'
              onClick={messageInput.openEmojiPicker}
              tabIndex={0}
            >
              <EmojiIcon />
            </span>
          </div>
          <EmojiPicker {...messageInput} />
        </div>
        {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
      </div>
    </div>
  );
};

MessageInputSimple.propTypes = {
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: /** @type {PropTypes.Validator<React.TextareaHTMLAttributes<import('../../../types/types').UnknownType>>} */ (PropTypes.object),
  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** Disable mentions in textarea */
  disableMentions: PropTypes.bool,
  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,
  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,
  /**
   * Custom UI component for emoji button in input.
   *
   * Defaults to and accepts same props as: [EmojiIconLarge](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.js)
   * */
  EmojiIcon: /** @type {PropTypes.Validator<React.FC>} */ (PropTypes.elementType),
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,
  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,
  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,
  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,
  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  SendButton: /** @type {PropTypes.Validator<React.FC<import('types').SendButtonProps>>} */ (PropTypes.elementType),
  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList: /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */ (PropTypes.elementType),
};

MessageInputSimple.defaultProps = {
  additionalTextareaProps: {},
  disabled: false,
  focus: false,
  grow: true,
  maxRows: 10,
  publishTypingEvent: true,
};

export default MessageInputSimple;
