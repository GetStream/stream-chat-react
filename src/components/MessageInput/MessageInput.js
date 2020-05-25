/* eslint-disable */
import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import Immutable from 'seamless-immutable';
import uniq from 'lodash/uniq';
import { logChatPromiseExecution } from 'stream-chat';
import {
  dataTransferItemsHaveFiles,
  dataTransferItemsToFiles,
} from 'react-file-utils';

import MessageInputLarge from './MessageInputLarge';
import SendButton from './SendButton';
import { generateRandomId } from '../../utils';
import { withChannelContext } from '../../context';

// polyfill for IE11 to make MessageInput functional
if (!Element.prototype.matches) {
  Element.prototype.matches =
    Element.prototype.msMatchesSelector ||
    Element.prototype.webkitMatchesSelector;
}

/**
 * MessageInput - Input a new message, support for all the rich features such as image uploads, @mentions, emoticons etc.
 * @example ../../docs/MessageInput.md
 * @extends PureComponent
 */
class MessageInput extends PureComponent {
  constructor(props) {
    super(props);

    const imageOrder = [];
    const imageUploads = {};
    const fileOrder = [];
    const fileUploads = {};
    const attachments = [];
    const mentioned_users = [];
    let text = '';
    if (props.message) {
      text = props.message.text;
      for (const attach of props.message.attachments) {
        if (attach.type === 'image') {
          const id = generateRandomId();
          imageOrder.push(id);
          imageUploads[id] = {
            id,
            url: attach.image_url,
            state: 'finished',
            file: { name: attach.fallback },
          };
        } else if (attach.type === 'file') {
          const id = generateRandomId();
          fileOrder.push(id);
          fileUploads[id] = {
            id,
            url: attach.asset_url,
            state: 'finished',
            file: {
              name: attach.title,
              type: attach.mime_type,
              size: attach.file_size,
            },
          };
        } else {
          attachments.push(attach);
        }
      }
      for (const mention of props.message.mentioned_users) {
        mentioned_users.push(mention.id);
      }
    }

    this.state = {
      text,
      attachments,
      imageOrder,
      imageUploads: Immutable(imageUploads),
      fileOrder,
      fileUploads: Immutable(fileUploads),
      emojiPickerIsOpen: false,
      filePanelIsOpen: false,
      mentioned_users,
      numberOfUploads: 0,
    };

    this.textareaRef = React.createRef();
    this.emojiPickerRef = React.createRef();
    this.panelRef = React.createRef();
  }

  static propTypes = {
    /** Set focus to the text input if this is enabled */
    focus: PropTypes.bool.isRequired,
    /** Disable input */
    disabled: PropTypes.bool.isRequired,
    /** Grow the textarea while you're typing */
    grow: PropTypes.bool.isRequired,
    /** Set the maximum number of rows */
    maxRows: PropTypes.number.isRequired,
    /** Via Context: the channel that we're sending the message to */
    channel: PropTypes.object.isRequired,
    /** Via Context: the users currently typing, passed from the Channel component */
    typing: PropTypes.object.isRequired,

    // /** Set textarea to be disabled */
    // disabled: PropTypes.bool,

    /** The parent message object when replying on a thread */
    parent: PropTypes.object,

    /**
     * The component handling how the input is rendered
     *
     * Available built-in components (also accepts the same props as):
     *
     * 1. [MessageInputSmall](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputSmall.js)
     * 2. [MessageInputLarge](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputLarge.js) (default)
     * 3. [MessageInputFlat](https://github.com/GetStream/stream-chat-react/blob/master/src/components/MessageInputFlat.js)
     *
     * */
    Input: PropTypes.elementType,

    /** Override image upload request */
    doImageUploadRequest: PropTypes.func,

    /** Override file upload request */
    doFileUploadRequest: PropTypes.func,
    /**
     * Custom UI component for send button.
     *
     * Defaults to and accepts same props as: [SendButton](https://getstream.github.io/stream-chat-react/#sendbutton)
     * */
    SendButton: PropTypes.elementType,
    /**
     * Any additional attrubutes that you may want to add for underlying HTML textarea element.
     * e.g.
     * <MessageInput
     *  additionalTextareaProps={{
     *    maxLength: 10,
     *  }}
     * />
     */
    additionalTextareaProps: PropTypes.object,
    /**
     * @param message: the Message object to be sent
     * @param cid: the channel id
     */
    overrideSubmitHandler: PropTypes.func,
  };

  static defaultProps = {
    focus: false,
    disabled: false,
    grow: true,
    maxRows: 10,
    Input: MessageInputLarge,
    SendButton,
    additionalTextareaProps: {},
  };

  componentDidMount() {
    if (this.props.focus) {
      this.textareaRef.current.focus();
    }
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.closeEmojiPicker, false);
    document.removeEventListener('click', this.hideFilePanel, false);
  }

  openEmojiPicker = () => {
    if (!this.state.showEmojiPicker) {
      this.setState(
        () => ({
          emojiPickerIsOpen: true,
        }),
        () => {
          document.addEventListener('click', this.closeEmojiPicker, false);
        },
      );
    }
  };

  closeEmojiPicker = (e) => {
    if (
      this.emojiPickerRef.current &&
      !this.emojiPickerRef.current.contains(e.target)
    ) {
      this.setState(
        {
          emojiPickerIsOpen: false,
        },
        () => {
          document.removeEventListener('click', this.closeEmojiPicker, false);
        },
      );
    }
  };

  onSelectEmoji = (emoji) => this.insertText(emoji.native);

  insertText = async (textToInsert) => {
    let newCursorPosition;

    await this.setState((prevState) => {
      const prevText = prevState.text;
      const textareaElement = this.textareaRef.current;

      if (!textareaElement) {
        return { text: prevText + textToInsert };
      }
      // Insert emoji at previous cursor position
      const { selectionStart, selectionEnd } = textareaElement;
      newCursorPosition = selectionStart + textToInsert.length;
      return {
        text:
          prevText.slice(0, selectionStart) +
          textToInsert +
          prevText.slice(selectionEnd),
      };
    });

    const textareaElement = this.textareaRef.current;
    if (!textareaElement || newCursorPosition == null) {
      return;
    }
    // Update cursorPosition
    textareaElement.selectionStart = newCursorPosition;
    textareaElement.selectionEnd = newCursorPosition;
  };

  getCommands = () => this.props.channel.getConfig().commands;

  getUsers = () => {
    const users = [];

    const members = this.props.channel.state.members;
    const watchers = this.props.channel.state.watchers;

    if (members && Object.values(members).length) {
      Object.values(members).forEach((member) => users.push(member.user));
    }

    if (watchers && Object.values(watchers).length) {
      users.push(...Object.values(watchers));
    }

    // make sure we don't list users twice
    const userMap = {};
    for (const user of users) {
      if (user !== undefined && !userMap[user.id]) {
        userMap[user.id] = user;
      }
    }
    return Object.values(userMap);
  };

  handleChange = (event) => {
    event.preventDefault();
    if (!event || !event.target) {
      return '';
    }

    const text = event.target.value;
    this.setState({ text });
    if (text) {
      logChatPromiseExecution(
        this.props.channel.keystroke(),
        'start typing event',
      );
    }
  };

  handleSubmit = (event) => {
    event.preventDefault();
    const editing = !!this.props.message;
    const trimmedMessage = this.state.text.trim();
    const isEmptyMessage =
      trimmedMessage === '' ||
      trimmedMessage === '>' ||
      trimmedMessage === '``````' ||
      trimmedMessage === '``' ||
      trimmedMessage === '**' ||
      trimmedMessage === '____' ||
      trimmedMessage === '__' ||
      trimmedMessage === '****';
    const hasFiles =
      this.state.imageOrder.length > 0 || this.state.fileOrder.length > 0;
    if (isEmptyMessage && !hasFiles) {
      return;
    }
    const text = this.state.text;
    // the channel component handles the actual sending of the message
    const attachments = [...this.state.attachments];

    for (const id of this.state.imageOrder) {
      const image = this.state.imageUploads[id];
      if (!image || image.state === 'failed') {
        continue;
      }
      if (image.state === 'uploading') {
        // TODO: show error to user that they should wait until image is uploaded
        return;
      }
      const dupe = attachments.filter(
        (attach) => image.url === attach.image_url,
      );
      if (dupe.length >= 1) continue;
      attachments.push({
        type: 'image',
        image_url: image.url,
        fallback: image.file.name,
      });
    }
    for (const id of this.state.fileOrder) {
      const upload = this.state.fileUploads[id];
      if (!upload || upload.state === 'failed') {
        continue;
      }
      if (upload.state === 'uploading') {
        // TODO: show error to user that they should wait until image is uploaded
        return;
      }

      attachments.push({
        type: 'file',
        asset_url: upload.url,
        title: upload.file.name,
        mime_type: upload.file.type,
        file_size: upload.file.size,
      });
    }

    if (editing) {
      const { id } = this.props.message;
      const updatedMessage = { id };
      updatedMessage.text = text;
      updatedMessage.attachments = attachments;
      updatedMessage.mentioned_users = this.state.mentioned_users;
      // TODO: Remove this line and show an error when submit fails
      this.props.clearEditingState();

      const updateMessagePromise = this.props
        .editMessage(updatedMessage)
        .then(this.props.clearEditingState);

      logChatPromiseExecution(updateMessagePromise, 'update message');
    } else if (
      this.props.overrideSubmitHandler &&
      typeof this.props.overrideSubmitHandler === 'function'
    ) {
      this.props.overrideSubmitHandler(
        {
          text,
          attachments,
          mentioned_users: uniq(this.state.mentioned_users),
          parent: this.props.parent,
        },
        this.props.channel.cid,
      );
      this.setState({
        text: '',
        mentioned_users: [],
        imageUploads: Immutable({}),
        imageOrder: [],
        fileUploads: Immutable({}),
        fileOrder: [],
      });
    } else {
      const sendMessagePromise = this.props.sendMessage({
        text,
        attachments,
        mentioned_users: uniq(this.state.mentioned_users),
        parent: this.props.parent,
      });
      logChatPromiseExecution(sendMessagePromise, 'send message');
      this.setState({
        text: '',
        mentioned_users: [],
        imageUploads: Immutable({}),
        imageOrder: [],
        fileUploads: Immutable({}),
        fileOrder: [],
      });
    }

    logChatPromiseExecution(this.props.channel.stopTyping(), 'stop typing');
  };

  _uploadNewFiles = (files) => {
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        this._uploadNewImage(file);
      } else if (file instanceof File && !this.props.noFiles) {
        this._uploadNewFile(file);
      } else {
        return;
      }
    }
  };

  _uploadNewImage = async (file) => {
    const id = generateRandomId();

    await this.setState((prevState) => ({
      numberOfUploads: prevState.numberOfUploads + 1,
      imageOrder: prevState.imageOrder.concat(id),
      imageUploads: prevState.imageUploads.setIn([id], {
        id,
        file,
        state: 'uploading',
      }),
    }));
    if (FileReader) {
      // TODO: Possibly use URL.createObjectURL instead. However, then we need
      // to release the previews when not used anymore though.
      const reader = new FileReader();
      reader.onload = (event) => {
        this.setState((prevState) => ({
          imageUploads: prevState.imageUploads.setIn(
            [id, 'previewUri'],
            event.target.result,
          ),
        }));
      };
      reader.readAsDataURL(file);
    }
    return this._uploadImage(id);
  };

  _uploadNewFile = async (file) => {
    const id = generateRandomId();

    await this.setState((prevState) => ({
      numberOfUploads: prevState.numberOfUploads + 1,
      fileOrder: prevState.fileOrder.concat(id),
      fileUploads: prevState.fileUploads.setIn([id], {
        id,
        file,
        state: 'uploading',
      }),
    }));

    return this._uploadFile(id);
  };

  _uploadImage = async (id) => {
    const img = this.state.imageUploads[id];
    if (!img) {
      return;
    }
    const { file } = img;

    await this.setState((prevState) => ({
      imageUploads: prevState.imageUploads.setIn([id, 'state'], 'uploading'),
    }));

    let response = {};
    response = {};
    try {
      if (this.props.doImageUploadRequest) {
        response = await this.props.doImageUploadRequest(
          file,
          this.props.channel,
        );
      } else {
        response = await this.props.channel.sendImage(file);
      }
    } catch (e) {
      console.warn(e);
      let alreadyRemoved = false;
      await this.setState((prevState) => {
        const image = prevState.imageUploads[id];
        if (!image) {
          alreadyRemoved = true;
          return {
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        }
        return {
          imageUploads: prevState.imageUploads.setIn([id, 'state'], 'failed'),
          numberOfUploads: prevState.numberOfUploads - 1,
        };
      });

      if (!alreadyRemoved) {
        this.props.errorHandler(e, 'upload-image', {
          feedGroup: this.props.feedGroup,
          userId: this.props.userId,
        });
      }
      return;
    }
    this.setState((prevState) => ({
      imageUploads: prevState.imageUploads
        .setIn([id, 'state'], 'finished')
        .setIn([id, 'url'], response.file),
    }));
  };

  _uploadFile = async (id) => {
    const upload = this.state.fileUploads[id];
    if (!upload) {
      return;
    }
    const { file } = upload;
    await this.setState((prevState) => ({
      imageUploads: prevState.imageUploads.setIn([id, 'state'], 'uploading'),
    }));

    let response = {};
    response = {};

    try {
      if (this.props.doFileUploadRequest) {
        response = await this.props.doFileUploadRequest(
          file,
          this.props.channel,
        );
      } else {
        response = await this.props.channel.sendFile(file);
      }
    } catch (e) {
      console.warn(e);
      let alreadyRemoved = false;
      await this.setState((prevState) => {
        const image = prevState.imageUploads[id];
        if (!image) {
          alreadyRemoved = true;
          return {
            numberOfUploads: prevState.numberOfUploads - 1,
          };
        }
        return {
          numberOfUploads: prevState.numberOfUploads - 1,
          fileUploads: prevState.fileUploads.setIn([id, 'state'], 'failed'),
        };
      });
      if (!alreadyRemoved) {
        this.props.errorHandler(e, 'upload-file', {
          feedGroup: this.props.feedGroup,
          userId: this.props.userId,
        });
      }
    }
    this.setState((prevState) => ({
      fileUploads: prevState.fileUploads
        .setIn([id, 'state'], 'finished')
        .setIn([id, 'url'], response.file),
    }));
  };

  _removeImage = (id) => {
    // TODO: cancel upload if still uploading
    this.setState((prevState) => {
      const img = prevState.imageUploads[id];
      if (!img) {
        return {};
      }
      return {
        numberOfUploads: prevState.numberOfUploads - 1,
        imageUploads: prevState.imageUploads.set(id, undefined), // remove
        imageOrder: prevState.imageOrder.filter((_id) => id !== _id),
      };
    });
  };

  _removeFile = (id) => {
    // TODO: cancel upload if still uploading
    this.setState((prevState) => {
      const upload = prevState.fileUploads[id];
      if (!upload) {
        return {};
      }
      return {
        numberOfUploads: prevState.numberOfUploads - 1,
        fileUploads: prevState.fileUploads.set(id, undefined), // remove
        fileOrder: prevState.fileOrder.filter((_id) => id !== _id),
      };
    });
  };

  _onPaste = async (event) => {
    // TODO: Move this handler to package with ImageDropzone
    const { items } = event.clipboardData;
    if (!dataTransferItemsHaveFiles(items)) {
      return;
    }

    event.preventDefault();
    // Get a promise for the plain text in case no files are
    // found. This needs to be done here because chrome cleans
    // up the DataTransferItems after resolving of a promise.
    let plainTextPromise;
    for (const item of items) {
      if (item.kind === 'string' && item.type === 'text/plain') {
        plainTextPromise = new Promise((resolve) => {
          item.getAsString((s) => {
            resolve(s);
          });
        });
        break;
      }
    }

    const fileLikes = await dataTransferItemsToFiles(items);
    if (fileLikes.length) {
      this._uploadNewFiles(fileLikes);
      return;
    }
    // fallback to regular text paste
    if (plainTextPromise) {
      const s = await plainTextPromise;
      this.insertText(s);
    }
  };

  _onSelectItem = (item) => {
    this.setState((prevState) => ({
      mentioned_users: [...prevState.mentioned_users, item.id],
    }));
  };

  render() {
    const { Input } = this.props;
    const handlers = {
      uploadNewFiles: this._uploadNewFiles,
      removeImage: this._removeImage,
      uploadImage: this._uploadImage,
      removeFile: this._removeFile,
      uploadFile: this._uploadFile,
      emojiPickerRef: this.emojiPickerRef,
      panelRef: this.panelRef,
      textareaRef: this.textareaRef,
      onSelectEmoji: this.onSelectEmoji,
      getUsers: this.getUsers,
      getCommands: this.getCommands,
      handleSubmit: this.handleSubmit,
      handleChange: this.handleChange,
      onPaste: this._onPaste,
      onSelectItem: this._onSelectItem,
      openEmojiPicker: this.openEmojiPicker,
    };
    return <Input {...this.props} {...this.state} {...handlers} />;
  }
}

export default withChannelContext(MessageInput);
