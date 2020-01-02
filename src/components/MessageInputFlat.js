import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { ChatAutoComplete } from './ChatAutoComplete';

import {
  ImageDropzone,
  ImagePreviewer,
  FilePreviewer,
  FileUploadButton,
} from 'react-file-utils';

import { Picker } from 'emoji-mart';

/**
 * MessageInputFlat - Large Message Input to be used for the MessageInput.
 * @example ./docs/MessageInputFlat.md
 */
export class MessageInputFlat extends PureComponent {
  static propTypes = {
    /** Set focus to the text input if this is enabled */
    focus: PropTypes.bool,
    /** Grow the textarea while you're typing */
    grow: PropTypes.bool,
    /** Disable the textarea */
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
    maxNumberOfFiles: PropTypes.object,
    /** @see See [channel context](https://getstream.github.io/stream-chat-react/#channel) doc */
    acceptedFiles: PropTypes.object,
  };

  static defaultProps = {
    grow: true,
    disabled: false,
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
          disabled={this.props.numberOfUploads >= this.props.maxNumberOfFiles}
        />
      )}
      {this.props.fileOrder.length > 0 && (
        <div className="str-chat__file-uploads">
          <FilePreviewer
            uploads={this.props.fileOrder.map(
              (id) => this.props.fileUploads[id],
            )}
            handleRemove={this.props.removeFile}
            handleRetry={this.props.uploadFile}
            handleFiles={this.props.uploadNewFiles}
          />
        </div>
      )}
    </>
  );

  renderEmojiPicker = () => {
    if (this.props.emojiPickerIsOpen) {
      return (
        <div
          className="str-chat__input-flat--emojipicker"
          ref={this.props.emojiPickerRef}
        >
          <Picker
            native
            emoji="point_up"
            title="Pick your emoji…"
            onSelect={this.props.onSelectEmoji}
            color="#006CFF"
            showPreview={false}
          />
        </div>
      );
    }
  };

  render() {
    const SendButton = this.props.SendButton;
    return (
      <div
        className={`str-chat__input-flat ${
          SendButton ? 'str-chat__input-flat--send-button-active' : null
        }`}
      >
        <ImageDropzone
          accept={this.props.acceptedFiles}
          multiple={this.props.multipleUploads}
          disabled={this.props.numberOfUploads >= this.props.maxNumberOfFiles}
          handleFiles={this.props.uploadNewFiles}
        >
          <div className="str-chat__input-flat-wrapper">
            {this.renderUploads()}
            {this.renderEmojiPicker()}

            <div className="str-chat__input-flat--textarea-wrapper">
              <ChatAutoComplete
                users={this.props.getUsers()}
                commands={this.props.getCommands()}
                innerRef={this.props.textareaRef}
                handleSubmit={(e) => this.props.handleSubmit(e)}
                onSelectItem={this.props.onSelectItem}
                onChange={this.props.handleChange}
                value={this.props.text}
                rows={1}
                maxRows={this.props.maxRows}
                placeholder="Type your message"
                onPaste={this.props.onPaste}
                grow={this.props.grow}
                onFocus={this.props.onFocus}
                disabled={this.props.disabled}
              />

              <span
                className="str-chat__input-flat-emojiselect"
                onClick={this.props.openEmojiPicker}
              >
                <svg width="28" height="28" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M22.217 16.1c.483.25.674.849.423 1.334C21.163 20.294 17.771 22 14 22c-3.867 0-7.347-1.765-8.66-4.605a.994.994 0 0 1 .9-1.407c.385 0 .739.225.9.575C8.135 18.715 10.892 20 14 20c3.038 0 5.738-1.267 6.879-3.476a.99.99 0 0 1 1.338-.424zm1.583-3.652c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.338 0-.659-.132-.858-.389-.212-.276-.476-.611-1.076-.611-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.517-.349-.578-.947-.235-1.388.66-.847 1.483-1.445 2.789-1.445 1.305 0 2.136.6 2.79 1.448zm-14 0c.341.443.235 1.064-.237 1.384a1.082 1.082 0 0 1-.62.168c-.339 0-.659-.132-.858-.389C7.873 13.335 7.61 13 7.01 13c-.598 0-.864.337-1.08.614-.197.254-.517.386-.854.386-.224 0-.438-.045-.62-.167-.518-.349-.579-.947-.235-1.388C4.88 11.598 5.703 11 7.01 11c1.305 0 2.136.6 2.79 1.448zM14 0c7.732 0 14 6.268 14 14s-6.268 14-14 14S0 21.732 0 14 6.268 0 14 0zm8.485 22.485A11.922 11.922 0 0 0 26 14c0-3.205-1.248-6.219-3.515-8.485A11.922 11.922 0 0 0 14 2a11.922 11.922 0 0 0-8.485 3.515A11.922 11.922 0 0 0 2 14c0 3.205 1.248 6.219 3.515 8.485A11.922 11.922 0 0 0 14 26c3.205 0 6.219-1.248 8.485-3.515z"
                    fillRule="evenodd"
                  />
                </svg>
              </span>
              <FileUploadButton
                multiple={this.props.multipleUploads}
                disabled={
                  this.props.numberOfUploads >= this.props.maxNumberOfFiles
                }
                accepts={this.props.acceptedFiles}
                handleFiles={this.props.uploadNewFiles}
              >
                <span className="str-chat__input-flat-fileupload">
                  <svg
                    width="14"
                    height="14"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M1.667.333h10.666c.737 0 1.334.597 1.334 1.334v10.666c0 .737-.597 1.334-1.334 1.334H1.667a1.333 1.333 0 0 1-1.334-1.334V1.667C.333.93.93.333 1.667.333zm2 1.334a1.667 1.667 0 1 0 0 3.333 1.667 1.667 0 0 0 0-3.333zm-2 9.333v1.333h10.666v-4l-2-2-4 4-2-2L1.667 11z"
                      fillRule="nonzero"
                    />
                  </svg>
                </span>
              </FileUploadButton>
              {SendButton && (
                <SendButton sendMessage={this.props.handleSubmit} />
              )}
            </div>
          </div>
        </ImageDropzone>
      </div>
    );
  }
}
