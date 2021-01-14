// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';
// @ts-ignore
import {
  ImageDropzone,
  FileUploadButton,
  // @ts-ignore
} from 'react-file-utils';

import { TranslationContext, ChannelContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import { Tooltip } from '../Tooltip';
import useMessageInput from './hooks/messageInput';
import EmojiPicker from './EmojiPicker';
import UploadsPreview from './UploadsPreview';
import DefaultSendButton, {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
} from './icons';

/** @type {React.FC<import("types").MessageInputProps>} */
const MessageInputLarge = (props) => {
  const {
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
    SendButton = DefaultSendButton,
  } = props;

  const channelContext = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  const messageInput = useMessageInput(props);

  /**
   * @typedef {import("stream-chat").Event} ClientEvent
   * @param {{ [userid: string]: ClientEvent } | {}} typingUsers
   */
  const constructTypingString = (typingUsers) => {
    const otherTypingUsers = Object.values(typingUsers)
      .filter(({ user }) => channelContext.client?.user?.id !== user?.id)
      .map(({ user }) => user?.name || user?.id);
    if (otherTypingUsers.length === 0) return '';
    if (otherTypingUsers.length === 1) {
      return t('{{ user }} is typing...', { user: otherTypingUsers[0] });
    }
    if (otherTypingUsers.length === 2) {
      // joins all with "and" but =no commas
      // example: "bob and sam"
      return t('{{ firstUser }} and {{ secondUser }} are typing...', {
        firstUser: otherTypingUsers[0],
        secondUser: otherTypingUsers[1],
      });
    }
    // joins all with commas, but last one gets ", and" (oxford comma!)
    // example: "bob, joe, and sam"
    return t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
      commaSeparatedUsers: otherTypingUsers.slice(0, -1).join(', '),
      lastUser: otherTypingUsers[otherTypingUsers.length - 1],
    });
  };

  return (
    <div className="str-chat__input-large">
      <ImageDropzone
        accept={channelContext.acceptedFiles}
        multiple={channelContext.multipleUploads}
        disabled={
          !messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0
        }
        maxNumberOfFiles={messageInput.maxFilesLeft}
        handleFiles={messageInput.uploadNewFiles}
      >
        <div className="str-chat__input">
          <EmojiPicker {...messageInput} />
          <div className="str-chat__input--textarea-wrapper">
            {messageInput.isUploadEnabled && (
              <UploadsPreview {...messageInput} />
            )}
            <ChatAutoComplete
              commands={messageInput.getCommands()}
              innerRef={messageInput.textareaRef}
              handleSubmit={messageInput.handleSubmit}
              onChange={messageInput.handleChange}
              onSelectItem={messageInput.onSelectItem}
              value={messageInput.text}
              rows={1}
              maxRows={props.maxRows}
              placeholder={t('Type your message')}
              onPaste={messageInput.onPaste}
              triggers={props.autocompleteTriggers}
              grow={props.grow}
              disabled={props.disabled}
              disableMentions={props.disableMentions}
              SuggestionList={props.SuggestionList}
              additionalTextareaProps={props.additionalTextareaProps}
            />
            <div className="str-chat__emojiselect-wrapper">
              <Tooltip>{t('Open emoji picker')}</Tooltip>
              <span
                className="str-chat__input-emojiselect"
                onClick={messageInput.openEmojiPicker}
                ref={messageInput.emojiPickerRef}
              >
                <EmojiIcon />
              </span>
            </div>
            {messageInput.isUploadEnabled && (
              <div
                className="str-chat__fileupload-wrapper"
                data-testid="fileinput"
              >
                <Tooltip>
                  {messageInput.maxFilesLeft
                    ? t('Attach files')
                    : t("You've reached the maximum number of files")}
                </Tooltip>
                <FileUploadButton
                  multiple={channelContext.multipleUploads}
                  disabled={messageInput.maxFilesLeft === 0}
                  accepts={channelContext.acceptedFiles}
                  handleFiles={messageInput.uploadNewFiles}
                >
                  <span className="str-chat__input-fileupload">
                    <FileUploadIcon />
                  </span>
                </FileUploadButton>
              </div>
            )}
          </div>
          {SendButton && <SendButton sendMessage={messageInput.handleSubmit} />}
        </div>
        <div>
          <div className="str-chat__input-footer">
            <span
              className={`str-chat__input-footer--count ${
                !channelContext.watcher_count
                  ? 'str-chat__input-footer--count--hidden'
                  : ''
              }`}
            >
              {t('{{ watcherCount }} online', {
                watcherCount: channelContext.watcher_count,
              })}
            </span>
            <span className="str-chat__input-footer--typing">
              {constructTypingString(channelContext.typing || {})}
            </span>
          </div>
        </div>
      </ImageDropzone>
    </div>
  );
};

MessageInputLarge.propTypes = {
  /** Set focus to the text input if this is enabled */
  focus: PropTypes.bool.isRequired,
  /** Grow the textarea while you're typing */
  grow: PropTypes.bool.isRequired,
  /** Specify the max amount of rows the textarea is able to grow */
  maxRows: PropTypes.number.isRequired,
  /** Make the textarea disabled */
  disabled: PropTypes.bool,
  /** Disable mentions in textarea */
  disableMentions: PropTypes.bool,
  /** enable/disable firing the typing event */
  publishTypingEvent: PropTypes.bool,
  /**
   * Any additional attributes that you may want to add for underlying HTML textarea element.
   */
  additionalTextareaProps: /** @type {PropTypes.Validator<React.TextareaHTMLAttributes<import('types').AnyType>>} */ (PropTypes.object),
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
   * Custom UI component for emoji button in input.
   *
   * Defaults to and accepts same props as: [EmojiIconSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.js)
   * */
  EmojiIcon: /** @type {PropTypes.Validator<React.FC>} */ (PropTypes.elementType),
  /**
   * Custom UI component for file upload button in input.
   *
   * Defaults to and accepts same props as: [FileUploadIcon](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInput/icons.js)
   * */
  FileUploadIcon: /** @type {PropTypes.Validator<React.FC>} */ (PropTypes.elementType),
  /**
   * Custom UI component for send button.
   *
   * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
   * */
  SendButton: /** @type {PropTypes.Validator<React.FC<import('types').SendButtonProps>>} */ (PropTypes.elementType),
  /** Optional UI component prop to override the default List component that displays suggestions */
  SuggestionList: /** @type {PropTypes.Validator<React.ElementType<import('types').SuggestionListProps>>} */ (PropTypes.elementType),
};

MessageInputLarge.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  Input: MessageInputLarge,
  additionalTextareaProps: {},
};

export default MessageInputLarge;
