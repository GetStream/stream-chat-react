// @ts-check
import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
// @ts-ignore
import { ImageDropzone, FileUploadButton } from 'react-file-utils';
import { Tooltip } from '../Tooltip';

import { ChannelContext, TranslationContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import useMessageInput from './hooks/messageInput';
import UploadsPreview from './UploadsPreview';
import EmojiPicker from './EmojiPicker';
import {
  EmojiIconSmall as DefaultEmojiIcon,
  FileUploadIcon as DefaultFileUploadIcon,
} from './icons';
import { KEY_CODES } from '../AutoCompleteTextarea';

/** @type {React.FC<import("types").MessageInputProps>} */
const EditMessageForm = (props) => {
  const {
    clearEditingState,
    EmojiIcon = DefaultEmojiIcon,
    FileUploadIcon = DefaultFileUploadIcon,
  } = props;

  const channelContext = useContext(ChannelContext);
  const { t } = useContext(TranslationContext);

  const messageInput = useMessageInput(props);

  useEffect(() => {
    /** @type {(event: KeyboardEvent) => void} Typescript syntax */
    const onKeyDown = (event) => {
      if (event.keyCode === KEY_CODES.ESC && clearEditingState)
        clearEditingState();
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [clearEditingState]);

  return (
    <div className="str-chat__edit-message-form">
      <ImageDropzone
        accept={channelContext.acceptedFiles}
        multiple={channelContext.multipleUploads}
        disabled={
          !messageInput.isUploadEnabled || messageInput.maxFilesLeft === 0
        }
        maxNumberOfFiles={messageInput.maxFilesLeft}
        handleFiles={messageInput.uploadNewFiles}
      >
        <form onSubmit={messageInput.handleSubmit}>
          {messageInput.isUploadEnabled && <UploadsPreview {...messageInput} />}
          <EmojiPicker {...messageInput} small />
          <ChatAutoComplete
            commands={messageInput.getCommands()}
            innerRef={messageInput.textareaRef}
            handleSubmit={messageInput.handleSubmit}
            onChange={messageInput.handleChange}
            onSelectItem={messageInput.onSelectItem}
            placeholder={t('Type your message')}
            value={messageInput.text}
            rows={1}
            maxRows={props.maxRows}
            onPaste={messageInput.onPaste}
            grow={props.grow}
            additionalTextareaProps={props.additionalTextareaProps}
          />
          <div className="str-chat__message-team-form-footer">
            <div className="str-chat__edit-message-form-options">
              <span
                className="str-chat__input-emojiselect"
                onClick={messageInput.openEmojiPicker}
              >
                <EmojiIcon />
              </span>
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
            <div>
              <button onClick={props.clearEditingState}>{t('Cancel')}</button>
              <button type="submit">{t('Send')}</button>
            </div>
          </div>
        </form>
      </ImageDropzone>
    </div>
  );
};

EditMessageForm.propTypes = {
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
  /**
   * Clears edit state for current message (passed down from message component)
   */
  clearEditingState: PropTypes.func,
};

EditMessageForm.defaultProps = {
  focus: false,
  disabled: false,
  publishTypingEvent: true,
  grow: true,
  maxRows: 10,
  additionalTextareaProps: {},
};

export default EditMessageForm;
