/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { Picker } from 'emoji-mart';
import {
  ImageDropzone,
  ImagePreviewer,
  FilePreviewer,
  FileUploadButton,
} from 'react-file-utils';

import { filterEmoji } from '../../utils';
import { withTranslationContext } from '../../context';
import { ChatAutoComplete } from '../ChatAutoComplete';
import { Tooltip } from '../Tooltip';

/**
 * MessageInputLarge - Large Message Input to be used for the MessageInput.
 * @example ../../docs/MessageInputLarge.md
 */
class MessageInputLarge extends PureComponent {
  static propTypes = {
    /** Set focus to the text input if this is enabled */
    focus: PropTypes.bool.isRequired,
    /** Grow the textarea while you're typing */
    grow: PropTypes.bool.isRequired,
    /** Specify the max amount of rows the textarea is able to grow */
    maxRows: PropTypes.number.isRequired,
    /** Make the textarea disabled */
    disabled: PropTypes.bool,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    imageOrder: PropTypes.array,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    imageUploads: PropTypes.object,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    removeImage: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    uploadImage: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    uploadNewFiles: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    numberOfUploads: PropTypes.number,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    fileOrder: PropTypes.array,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    fileUploads: PropTypes.object,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    removeFile: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    uploadFile: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    emojiPickerIsOpen: PropTypes.bool,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    emojiPickerRef: PropTypes.object,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    onSelectEmoji: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    getUsers: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    getCommands: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    textareaRef: PropTypes.object,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    handleSubmit: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    handleChange: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    onSelectItem: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    text: PropTypes.string,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    onPaste: PropTypes.func,
    /** @see See [MessageInput](https://getstream.github.io/stream-chat-react/#messageinput) for doc */
    openEmojiPicker: PropTypes.func,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    watcher_count: PropTypes.number,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    typing: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    multipleUploads: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    maxNumberOfFiles: PropTypes.number,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    acceptedFiles: PropTypes.object,
    /**
     * Custom UI component for send button.
     *
     * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
     * */
    SendButton: PropTypes.elementType,
    /**
     * Any additional attrubutes that you may want to add for underlying HTML textarea element.
     */
    additionalTextareaProps: PropTypes.object,
  };

  renderUploads = () => (
    <>
      {this.props.imageOrder.length > 0 && (
        <ImagePreviewer
          imageUploads={this.props.imageOrder.map(
            (id) => this.props.imageUploads[id],
          )}
          handleRemove={this.props.removeImage}
          handleRetry={this.props.uploadImage}
          handleFiles={this.props.uploadNewFiles}
          multiple={this.props.multipleUploads}
          disabled={
            this.props.numberOfUploads >= this.props.maxNumberOfFiles
              ? true
              : false
          }
        />
      )}
      {this.props.fileOrder.length > 0 && (
        <FilePreviewer
          uploads={this.props.fileOrder.map((id) => this.props.fileUploads[id])}
          handleRemove={this.props.removeFile}
          handleRetry={this.props.uploadFile}
          handleFiles={this.props.uploadNewFiles}
        />
      )}
    </>
  );

  renderEmojiPicker = () => {
    if (this.props.emojiPickerIsOpen) {
      return (
        <div
          className="str-chat__input--emojipicker"
          ref={this.props.emojiPickerRef}
        >
          <Picker
            native
            emoji="point_up"
            title="Pick your emoji…"
            onSelect={this.props.onSelectEmoji}
            color="#006CFF"
            showPreview={false}
            useButton={true}
            emojisToShowFilter={filterEmoji}
          />
        </div>
      );
    }
  };

  constructTypingString = (dict) => {
    const { t } = this.props;
    const arr2 = Object.keys(dict);
    const arr3 = [];
    arr2.forEach((item, i) => {
      if (this.props.client.user.id === dict[arr2[i]].user.id) {
        return;
      }
      arr3.push(dict[arr2[i]].user.name || dict[arr2[i]].user.id);
    });
    let outStr = '';
    if (arr3.length === 1) {
      outStr = t('{{ user }} is typing...', { user: arr3[0] });
      dict;
    } else if (arr3.length === 2) {
      //joins all with "and" but =no commas
      //example: "bob and sam"
      outStr = t('{{ firstUser }} and {{ secondUser }} are typing...', {
        firstUser: arr3[0],
        secondUser: arr3[1],
      });
    } else if (arr3.length > 2) {
      //joins all with commas, but last one gets ", and" (oxford comma!)
      //example: "bob, joe, and sam"
      outStr = t('{{ commaSeparatedUsers }} and {{ lastUser }} are typing...', {
        commaSeparatedUsers: arr3.slice(0, -1).join(', '),
        lastUser: arr3.slice(-1),
      });
    }

    return outStr;
  };

  render() {
    const { t } = this.props;
    const SendButton = this.props.SendButton;
    return (
      <div className="str-chat__input-large">
        <ImageDropzone
          accept={this.props.acceptedFiles}
          multiple={this.props.multipleUploads}
          disabled={
            this.props.numberOfUploads >= this.props.maxNumberOfFiles
              ? true
              : false
          }
          handleFiles={this.props.uploadNewFiles}
        >
          <div className="str-chat__input">
            {this.renderUploads()}
            {this.renderEmojiPicker()}
            <div className="str-chat__input--textarea-wrapper">
              <ChatAutoComplete
                users={this.props.getUsers()}
                commands={this.props.getCommands()}
                innerRef={this.props.textareaRef}
                handleSubmit={(e) => this.props.handleSubmit(e)}
                onChange={this.props.handleChange}
                onSelectItem={this.props.onSelectItem}
                value={this.props.text}
                rows={1}
                maxRows={this.props.maxRows}
                placeholder={t('Type your message')}
                onPaste={this.props.onPaste}
                grow={this.props.grow}
                disabled={this.props.disabled}
                additionalTextareaProps={this.props.additionalTextareaProps}
              />
              <div className="str-chat__emojiselect-wrapper">
                <Tooltip>{t('Open emoji picker')}</Tooltip>
                <span
                  className="str-chat__input-emojiselect"
                  onClick={this.props.openEmojiPicker}
                  onMouseEnter={this.showEmojiTooltip}
                  onMouseLeave={this.hideEmojiTooltip}
                  ref={this.emojiPickerRef}
                >
                  <svg
                    width="14"
                    height="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <title>{t('Open emoji picker')}</title>
                    <path
                      d="M11.108 8.05a.496.496 0 0 1 .212.667C10.581 10.147 8.886 11 7 11c-1.933 0-3.673-.882-4.33-2.302a.497.497 0 0 1 .9-.417C4.068 9.357 5.446 10 7 10c1.519 0 2.869-.633 3.44-1.738a.495.495 0 0 1 .668-.212zm.792-1.826a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.298 0-.431.168-.54.307A.534.534 0 0 1 9.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zm-7 0a.477.477 0 0 1-.119.692.541.541 0 0 1-.31.084.534.534 0 0 1-.428-.194c-.106-.138-.238-.306-.539-.306-.299 0-.432.168-.54.307A.533.533 0 0 1 2.538 7a.544.544 0 0 1-.31-.084.463.463 0 0 1-.117-.694c.33-.423.742-.722 1.394-.722.653 0 1.068.3 1.396.724zM7 0a7 7 0 1 1 0 14A7 7 0 0 1 7 0zm4.243 11.243A5.96 5.96 0 0 0 13 7a5.96 5.96 0 0 0-1.757-4.243A5.96 5.96 0 0 0 7 1a5.96 5.96 0 0 0-4.243 1.757A5.96 5.96 0 0 0 1 7a5.96 5.96 0 0 0 1.757 4.243A5.96 5.96 0 0 0 7 13a5.96 5.96 0 0 0 4.243-1.757z"
                      fillRule="evenodd"
                    />
                  </svg>
                </span>
              </div>
              <div
                className="str-chat__fileupload-wrapper"
                data-testid="fileinput"
              >
                <Tooltip>{t('Attach files')}</Tooltip>
                <FileUploadButton
                  multiple={this.props.multipleUploads}
                  disabled={
                    this.props.numberOfUploads >= this.props.maxNumberOfFiles
                      ? true
                      : false
                  }
                  accepts={this.props.acceptedFiles}
                  handleFiles={this.props.uploadNewFiles}
                >
                  <span
                    className="str-chat__input-fileupload"
                    onMouseEnter={this.showFileUploaderTooltip}
                    onMouseLeave={this.hideFileUploaderTooltip}
                    ref={this.fileUploaderRef}
                  >
                    <svg
                      width="14"
                      height="14"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <title>{t('Attach files')}</title>
                      <path
                        d="M7 .5c3.59 0 6.5 2.91 6.5 6.5s-2.91 6.5-6.5 6.5S.5 10.59.5 7 3.41.5 7 .5zm0 12c3.031 0 5.5-2.469 5.5-5.5S10.031 1.5 7 1.5A5.506 5.506 0 0 0 1.5 7c0 3.034 2.469 5.5 5.5 5.5zM7.506 3v3.494H11v1.05H7.506V11h-1.05V7.544H3v-1.05h3.456V3h1.05z"
                        fillRule="nonzero"
                      />
                    </svg>
                  </span>
                </FileUploadButton>
              </div>
            </div>
            {SendButton && <SendButton sendMessage={this.props.handleSubmit} />}
          </div>
          <div>
            <div className="str-chat__input-footer">
              <span
                className={`str-chat__input-footer--count ${
                  !this.props.watcher_count
                    ? 'str-chat__input-footer--count--hidden'
                    : ''
                }`}
              >
                {t('{{ watcherCount }} online', {
                  watcherCount: this.props.watcher_count,
                })}
              </span>
              <span className="str-chat__input-footer--typing">
                {this.constructTypingString(this.props.typing)}
              </span>
            </div>
          </div>
        </ImageDropzone>
      </div>
    );
  }
}

export default withTranslationContext(MessageInputLarge);
