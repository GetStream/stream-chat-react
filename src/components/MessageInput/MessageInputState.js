import { useReducer, useEffect, useContext, useRef, useCallback } from 'react';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';
import {
  dataTransferItemsHaveFiles,
  dataTransferItemsToFiles,
} from 'react-file-utils';
import { ChannelContext } from '../../context/ChannelContext';
import { generateRandomId } from '../../utils';

function initState(message) {
  if (!message) {
    return {
      text: '',
      imageOrder: [],
      imageUploads: Immutable({}),
      fileOrder: [],
      fileUploads: Immutable({}),
      numberOfUploads: 0,
      attachments: [],
      mentioned_users: [],
      emojiPickerIsOpen: false,
    };
  }

  // if message prop is defined, get imageuploads, fileuploads, text, etc. from it
  const imageUploads = message.attachments
    .filter(({ type }) => type === 'image')
    .reduce((acc, attachment) => {
      const id = generateRandomId();
      return acc.setIn([id], {
        id,
        url: attachment.image_url,
        state: 'finished',
        file: {
          name: attachment.fallback,
        },
      });
    }, Immutable({}));
  const imageOrder = Object.keys(imageUploads);

  const fileUploads = message.attachments
    .filter(({ type }) => type === 'file')
    .reduce((acc, attachment) => {
      const id = generateRandomId();
      return acc.setIn([id], {
        id,
        url: attachment.asset_url,
        state: 'finished',
        file: {
          name: attachment.title,
          type: attachment.mime_type,
          size: attachment.file_size,
        },
      });
    }, Immutable({}));
  const fileOrder = Object.keys(fileUploads);

  const numberOfUploads = fileOrder.length + imageOrder.length;

  const attachments = message.attachments.filter(
    ({ type }) => type !== 'file' && type !== 'image',
  );

  const mentioned_users = message.mentioned_users.map(({ id }) => id);

  return {
    text: message.text || '',
    imageOrder,
    imageUploads,
    fileOrder,
    fileUploads,
    numberOfUploads,
    attachments,
    mentioned_users,
    emojiPickerIsOpen: false,
  };
}

function messageInputReducer(state, action) {
  const { type, ...payload } = action;
  switch (action.type) {
    case 'setEmojiPickerIsOpen':
      return { ...state, emojiPickerIsOpen: payload.value };
    case 'setText':
      return { ...state, text: payload.getNewText(state.text) };
    case 'clear':
      return {
        ...state,
        text: '',
        mentioned_users: [],
        imageOrder: [],
        imageUploads: Immutable({}),
        fileOrder: [],
        fileUploads: Immutable({}),
      };
    case 'setImageUpload': {
      const imageAlreadyExists = state.imageUploads[payload.id];
      const imageOrder = imageAlreadyExists
        ? state.imageOrder
        : state.imageOrder.concat(payload.id);
      return {
        ...state,
        imageOrder,
        imageUploads: state.imageUploads.setIn([payload.id], payload),
        numberOfUploads: imageAlreadyExists
          ? state.numberOfUploads
          : state.numberOfUploads + 1,
      };
    }
    case 'setFileUpload': {
      const fileAlreadyExists = state.fileUploads[payload.id];
      const fileOrder = fileAlreadyExists
        ? state.fileOrder
        : state.fileOrder.concat(payload.id);
      return {
        ...state,
        fileOrder,
        fileUploads: state.fileUploads.setIn([payload.id], payload),
        numberOfUploads: fileAlreadyExists
          ? state.numberOfUploads
          : state.numberOfUploads + 1,
      };
    }
    case 'removeImageUpload':
      if (!state.imageUploads[payload.id]) return state; // cannot remove anything
      return {
        ...state,
        numberOfUploads: state.numberOfUploads - 1,
        imageOrder: state.imageOrder.filter((_id) => _id !== payload.id),
        imageUploads: state.imageUploads.without(payload.id),
      };
    case 'removeFileUpload':
      if (!state.fileUploads[payload.id]) return state; // cannot remove anything
      return {
        ...state,
        numberOfUploads: state.numberOfUploads - 1,
        fileOrder: state.fileOrder.filter((_id) => _id !== payload.id),
        fileUploads: state.fileUploads.without(payload.id),
      };
    case 'reduceNumberOfUploads': // TODO: figure out if we can just use uploadOrder instead
      return { ...state, numberOfUploads: state.numberOfUploads - 1 };
    case 'addMentionedUser':
      return {
        ...state,
        mentioned_users: state.mentioned_users.concat(payload.userId),
      };
    default:
      return state;
  }
}

export default function useMessageInputState(props) {
  const {
    doImageUploadRequest,
    doFileUploadRequest,
    focus,
    message,
    clearEditingState,
    overrideSubmitHandler,
    parent,
    noFiles,
    errorHandler,
  } = props;

  const [state, dispatch] = useReducer(messageInputReducer, message, initState);
  const textareaRef = useRef();
  const emojiPickerRef = useRef();
  const panelRef = useRef();
  const channelContext = useContext(ChannelContext);
  const {
    text,
    imageOrder,
    imageUploads,
    fileOrder,
    fileUploads,
    attachments,
    numberOfUploads,
    mentioned_users,
  } = state;
  const { channel, editMessage, sendMessage } = channelContext;

  // Focus

  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);

  // Text + cursor position

  const newCursorPosition = useRef(null);
  const insertText = useCallback(
    (textToInsert) => {
      if (!textareaRef.current) {
        dispatch({
          type: 'setText',
          getNewText: (t) => t + textToInsert,
        });
        return;
      }

      const textareaElement = textareaRef.current;
      const { selectionStart, selectionEnd } = textareaElement;
      newCursorPosition.current = selectionStart + textToInsert.length;
      dispatch({
        type: 'setText',
        getNewText: (prevText) =>
          prevText.slice(0, selectionStart) +
          textToInsert +
          prevText.slice(selectionEnd),
      });
    },
    [textareaRef, newCursorPosition],
  );

  useEffect(() => {
    if (newCursorPosition.current !== null) {
      const textareaElement = textareaRef.current;
      textareaElement.selectionStart = newCursorPosition;
      textareaElement.selectionEnd = newCursorPosition;
      newCursorPosition.current = null;
    }
  }, [text, newCursorPosition]);

  const handleChange = useCallback(
    (event) => {
      event.preventDefault();
      if (!event || !event.target) {
        return;
      }

      const newText = event.target.value;
      dispatch({
        type: 'setText',
        getNewText: () => newText,
      });
      if (newText) {
        logChatPromiseExecution(channel.keystroke(), 'start typing event');
      }
    },
    [channel],
  );

  // Emoji

  const closeEmojiPicker = useCallback(
    (e) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(e.target)
      ) {
        dispatch({
          type: 'setEmojiPickerIsOpen',
          value: false,
        });
        document.removeEventListener('click', closeEmojiPicker, false);
      }
    },
    [emojiPickerRef],
  );

  const openEmojiPicker = useCallback(() => {
    dispatch({
      type: 'setEmojiPickerIsOpen',
      value: true,
    });
    document.addEventListener('click', closeEmojiPicker, false);
  }, [closeEmojiPicker]);

  const onSelectEmoji = useCallback((emoji) => insertText(emoji.native), [
    insertText,
  ]);

  // Commands / mentions

  const getCommands = useCallback(() => channel.getConfig().commands, [
    channel,
  ]);

  const getUsers = useCallback(() => {
    return [
      ...Object.values(channel.state.members).map(({ user }) => user),
      ...Object.values(channel.state.watchers),
    ].filter(
      ({ id }, index, self) =>
        self.findIndex((user) => user.id === id) === index, // filter out non-unique ids
    );
  }, [channel]);

  const onSelectItem = useCallback((item) => {
    dispatch({ type: 'addMentionedUser', userId: item.id });
  }, []);

  // Submitting

  const getAttachmentsFromUploads = useCallback(() => {
    const imageAttachments = imageOrder
      .map((id) => imageUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .filter((
        { id, url },
        index,
        self, // filter out duplicates based on url
      ) => self.every((upload) => upload.id === id || upload.url !== url))
      .map((upload) => ({
        type: 'image',
        image_url: upload.url,
        fallback: upload.file.name,
      }));

    const fileAttachments = fileOrder
      .map((id) => fileUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .map((upload) => ({
        type: 'file',
        asset_url: upload.url,
        title: upload.file.name,
        mime_type: upload.file.type,
        file_size: upload.file.size,
      }));

    return [
      ...attachments, // from state
      ...imageAttachments,
      ...fileAttachments,
    ];
  }, [imageOrder, imageUploads, fileOrder, fileUploads, attachments]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const editing = !!message;
    const trimmedMessage = text.trim();
    const isEmptyMessage =
      trimmedMessage === '' ||
      trimmedMessage === '>' ||
      trimmedMessage === '``````' ||
      trimmedMessage === '``' ||
      trimmedMessage === '**' ||
      trimmedMessage === '____' ||
      trimmedMessage === '__' ||
      trimmedMessage === '****';
    if (isEmptyMessage && numberOfUploads === 0) {
      return;
    }
    // the channel component handles the actual sending of the message
    const someAttachmentsUploading =
      Object.values(imageUploads).some(
        (upload) => upload.state === 'uploading',
      ) ||
      Object.values(fileUploads).some((upload) => upload.state === 'uploading');
    if (someAttachmentsUploading) {
      // TODO: show error to user that they should wait until image is uploaded
      return;
    }

    const newAttachments = getAttachmentsFromUploads();

    const updatedMessage = {
      text,
      attachments: newAttachments,
      mentioned_users: mentioned_users.filter(
        (user, index, self) =>
          self.findIndex(({ id }) => user.id === id) === index,
      ),
    };

    if (editing) {
      // TODO: Remove this line and show an error when submit fails
      clearEditingState();

      const updateMessagePromise = editMessage({
        ...updatedMessage,
        id: message.id,
      }).then(clearEditingState);

      logChatPromiseExecution(updateMessagePromise, 'update message');
    } else if (
      overrideSubmitHandler &&
      typeof overrideSubmitHandler === 'function'
    ) {
      overrideSubmitHandler(
        {
          ...updatedMessage,
          parent,
        },
        channel.cid,
      );
      dispatch({ type: 'clear' });
    } else {
      const sendMessagePromise = sendMessage({
        ...updatedMessage,
        parent,
      });
      logChatPromiseExecution(sendMessagePromise, 'send message');
      dispatch({ type: 'clear' });
    }
    logChatPromiseExecution(channel.stopTyping(), 'stop typing');
  };

  // Attachments

  // Files

  const uploadFile = useCallback((id) => {
    dispatch({ type: 'setFileUpload', id, state: 'uploading' });
  }, []);

  useEffect(() => {
    (async () => {
      const upload = Object.values(fileUploads).find(
        (fileUpload) => fileUpload.state === 'uploading' && fileUpload.file,
      );
      if (!upload) return;

      const { id, file } = upload;
      let response = {};
      try {
        if (doFileUploadRequest) {
          response = await doFileUploadRequest(file, channel);
        } else {
          response = await channel.sendFile(file);
        }
      } catch (e) {
        console.warn(e);
        let alreadyRemoved = false;

        dispatch({ type: 'reduceNumberOfUploads' });
        if (!fileUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ type: 'setFileUpload', file, id, state: 'failed' });
        }
        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the paramaters passed to the error handler actually make sense
          errorHandler(e, 'upload-file', {
            id,
            file,
          });
        }
        return;
      }
      dispatch({
        type: 'setFileUpload',
        id,
        file,
        state: 'finished',
        url: response.file,
      });
    })();
  }, [fileUploads, channel, doFileUploadRequest, errorHandler]);

  const removeFile = useCallback((id) => {
    // TODO: cancel upload if still uploading
    dispatch({ type: 'removeFileUpload', id });
  }, []);

  // Images

  const uploadImage = useCallback(
    async (id) => {
      const img = imageUploads[id];
      if (!img) {
        return;
      }
      const { file } = img;
      if (img.state !== 'uploading') {
        dispatch({ type: 'setImageUpload', id, file, state: 'uploading' });
      }

      let response = {};
      try {
        if (doImageUploadRequest) {
          response = await doImageUploadRequest(file, channel);
        } else {
          response = await channel.sendImage(file);
        }
      } catch (e) {
        console.warn(e);
        let alreadyRemoved = false;
        dispatch({ type: 'reduceNumberOfUploads' });
        if (!imageUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ type: 'setImageUpload', id, file, state: 'failed' });
        }
        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the paramaters passed to the error handler actually make sense
          errorHandler(e, 'upload-image', {
            id,
            file,
          });
        }
        return;
      }
      if (!imageUploads[id]) return; // removed before done
      dispatch({
        type: 'setImageUpload',
        id,
        file,
        state: 'finished',
        url: response.file,
      });
    },
    [imageUploads, channel, doImageUploadRequest, errorHandler],
  );

  useEffect(() => {
    if (FileReader) {
      const upload = Object.values(imageUploads).find(
        (fileUpload) =>
          fileUpload.state === 'uploading' &&
          !!fileUpload.file &&
          !fileUpload.previewUri,
      );
      if (upload) {
        const { id, file } = upload;
        // TODO: Possibly use URL.createObjectURL instead. However, then we need
        // to release the previews when not used anymore though.
        const reader = new FileReader();
        reader.onload = (event) => {
          dispatch({
            type: 'setImageUpload',
            id,
            file,
            previewUri: event.target.result,
            state: 'uploading',
          });
        };
        reader.readAsDataURL(upload.file);
        uploadImage(id);
        return () => {
          reader.onload = null;
        };
      }
    }
    return () => {};
  }, [imageUploads, uploadImage]);

  const removeImage = useCallback((id) => {
    dispatch({ type: 'removeImageUpload', id });
    // TODO: cancel upload if still uploading
  }, []);

  const uploadNewFiles = useCallback(
    (files) => {
      files.forEach((file) => {
        const id = generateRandomId();
        if (file.type.startsWith('image/')) {
          dispatch({ type: 'setImageUpload', id, file, state: 'uploading' });
        } else if (file instanceof File && !noFiles) {
          dispatch({ type: 'setFileUpload', id, file, state: 'uploading' });
        }
      });
    },
    [noFiles],
  );

  const onPaste = useCallback(
    (e) => {
      (async (event) => {
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
        const plainTextItem = [...items].find(
          ({ kind, type }) => kind === 'string' && type === 'text/plain',
        );
        if (plainTextItem) {
          plainTextPromise = new Promise((resolve) => {
            plainTextItem.getAsString((s) => {
              resolve(s);
            });
          });
        }

        const fileLikes = await dataTransferItemsToFiles(items);
        if (fileLikes.length) {
          uploadNewFiles(fileLikes);
          return;
        }
        // fallback to regular text paste
        if (plainTextPromise) {
          const s = await plainTextPromise;
          insertText(s);
        }
      })(e);
    },
    [uploadNewFiles, insertText],
  );

  return {
    ...state,
    ...channelContext,
    // refs
    textareaRef,
    emojiPickerRef,
    panelRef,
    // handlers
    uploadNewFiles,
    removeImage,
    uploadImage,
    removeFile,
    uploadFile,
    onSelectEmoji,
    getUsers,
    getCommands,
    handleSubmit,
    handleChange,
    onPaste,
    onSelectItem,
    openEmojiPicker,
  };
}
