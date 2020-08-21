// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { TranslationContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import { Tooltip } from '../Tooltip';
import useMessageInput from './hooks/messageInput';
import EmojiPicker from './EmojiPicker';
import SendButtonComponent from './SendButton';

/** @type {React.FC<import("types").MessageInputProps>} */
const MessageInputSimple = (props) => {
  const messageInput = useMessageInput(props);
  const { t } = useContext(TranslationContext);
  const { SendButton } = props;

  return (
    <div
      className={`str-chat__input-flat ${
        SendButton ? 'str-chat__input-flat--send-button-active' : null
      }`}
    >
      <div className="str-chat__input-flat-wrapper">
        <EmojiPicker {...messageInput} />

        <div className="str-chat__input-flat--textarea-wrapper">
          <ChatAutoComplete
            commands={messageInput.getCommands()}
            innerRef={messageInput.textareaRef}
            handleSubmit={messageInput.handleSubmit}
            onSelectItem={messageInput.onSelectItem}
            onChange={messageInput.handleChange}
            value={messageInput.text}
            rows={1}
            maxRows={props.maxRows}
            placeholder={t('Type your message')}
            onPaste={messageInput.onPaste}
            triggers={props.autocompleteTriggers}
            grow={props.grow}
            disabled={props.disabled}
            additionalTextareaProps={props.additionalTextareaProps}
          />

          <div className="str-chat__emojiselect-wrapper">
            <Tooltip>{t('Open emoji picker')}</Tooltip>
            <span
              className="str-chat__input-flat-emojiselect"
              onClick={messageInput.openEmojiPicker}
            >
              <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                <title>{t('Open emoji picker')}</title>
                <path
                  d="M22.217 16.1c.483.25.674.849.423 1.334C21.163 20.294 17.771 22 14 22c-3.867 0-7.347-1.765-8.66-4.605a.994.994 0 0 1 .9-1.407c.385 0 .739.225.9.575C8.135 18.715 10.892 20 14 20c3.038 0 5.738-1.267 6.879-3.476a.99.99 0 0 1 1.338-.424zm1.583-3.652c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.338 0-.659-.132-.858-.389-.212-.276-.476-.611-1.076-.611-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.517-.349-.578-.947-.235-1.388.66-.847 1.483-1.445 2.789-1.445 1.305 0 2.136.6 2.79 1.448zm-14 0c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.339 0-.659-.132-.858-.389C7.873 13.335 7.61 13 7.01 13c-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.518-.349-.579-.947-.235-1.388C4.88 11.598 5.703 11 7.01 11c1.305 0 2.136.6 2.79 1.448zM14 0c7.732 0 14 6.268 14 14s-6.268 14-14 14S0 21.732 0 14 6.268 0 14 0zm8.485 22.485A11.922 11.922 0 0 0 26 14c0-3.205-1.248-6.219-3.515-8.485A11.922 11.922 0 0 0 14 2a11.922 11.922 0 0 0-8.485 3.515A11.922 11.922 0 0 0 2 14c0 3.205 1.248 6.219 3.515 8.485A11.922 11.922 0 0 0 14 26c3.205 0 6.219-1.248 8.485-3.515z"
                  fillRule="evenodd"
                />
              </svg>
            </span>
          </div>
        </div>
        {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
      </div>
    </div>
  );
};

MessageInputSimple.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,
  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,
  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,
  /**
   * Any additional attrubutes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: PropTypes.object,
  /**
   * Override the default triggers of the ChatAutoComplete component
   */
  autocompleteTriggers: PropTypes.object,
  /**
   * @param message: the Message object to be sent
   * @param cid: the channel id
   */
  overrideSubmitHandler: PropTypes.func,
  /** Override image upload request */
  doImageUploadRequest: PropTypes.func,
  /** Override file upload request */
  doFileUploadRequest: PropTypes.func,
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  // @ts-ignore
  SendButton: PropTypes.elementType,
};

MessageInputSimple.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  SendButton: SendButtonComponent,
  additionalTextareaProps: {},
};

export default MessageInputSimple;
