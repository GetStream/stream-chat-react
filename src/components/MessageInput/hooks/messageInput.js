// @ts-check
import {
  useReducer,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import Immutable from 'seamless-immutable';
import { logChatPromiseExecution } from 'stream-chat';
import {
  dataTransferItemsHaveFiles,
  dataTransferItemsToFiles,
  // @ts-ignore
} from 'react-file-utils';
import { ChannelContext } from '../../../context/ChannelContext';
import { generateRandomId } from '../../../utils';

/**
 * @typedef {import("types").MessageInputState} State
 * @typedef {import("types").MessageInputProps} Props
 * @typedef {import('stream-chat').Unpacked<ReturnType<import("types").StreamChatReactClient['sendFile']>>} FileUploadAPIResponse
 * @typedef {import('stream-chat').UserResponse} UserResponse
 */

/**
 * Get attachment type from MIME type
 * @param {string} mime
 * @returns {string}
 */
const getAttachmentTypeFromMime = (mime) => {
  if (mime.includes('video/')) return 'media';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};

/** @type {{ [id: string]: import('types').FileUpload }} */
const emptyFileUploads = {};
/** @type {{ [id: string]: import('types').ImageUpload }} */
const emptyImageUploads = {};

const apiMaxNumberOfFiles = 10;

/**
 * Initializes the state. Empty if the message prop is falsy.
 * @param {import("stream-chat").MessageResponse | undefined} message
 * @returns {State}
 */
function initState(message) {
  if (!message) {
    return {
      text: '',
      imageOrder: [],
      imageUploads: Immutable(emptyImageUploads),
      fileOrder: [],
      fileUploads: Immutable(emptyFileUploads),
      numberOfUploads: 0,
      attachments: [],
      mentioned_users: [],
      emojiPickerIsOpen: false,
    };
  }

  // if message prop is defined, get imageuploads, fileuploads, text, etc. from it
  const imageUploads =
    message.attachments
      ?.filter(({ type }) => type === 'image')
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
      }, Immutable(emptyImageUploads)) || Immutable(emptyImageUploads);
  const imageOrder = Object.keys(imageUploads);

  const fileUploads =
    message.attachments
      ?.filter(({ type }) => type === 'file')
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
      }, Immutable(emptyFileUploads)) || Immutable(emptyFileUploads);
  const fileOrder = Object.keys(fileUploads);

  const numberOfUploads = fileOrder.length + imageOrder.length;

  const attachments =
    message.attachments?.filter(
      ({ type }) => type !== 'file' && type !== 'image',
    ) || [];

  const mentioned_users = message.mentioned_users || [];

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
/**
 * MessageInput state reducer
 * @param {State} state
 * @param {import("./types").MessageInputReducerAction} action
 * @returns {State}
 */
function messageInputReducer(state, action) {
  switch (action.type) {
    case 'setEmojiPickerIsOpen':
      return { ...state, emojiPickerIsOpen: action.value };
    case 'setText':
      return { ...state, text: action.getNewText(state.text) };
    case 'clear':
      return {
        ...state,
        text: '',
        mentioned_users: [],
        imageOrder: [],
        imageUploads: Immutable(emptyImageUploads),
        fileOrder: [],
        fileUploads: Immutable(emptyFileUploads),
        numberOfUploads: 0,
      };
    case 'setImageUpload': {
      const imageAlreadyExists = state.imageUploads[action.id];
      if (!imageAlreadyExists && !action.file) return state;
      const imageOrder = imageAlreadyExists
        ? state.imageOrder
        : state.imageOrder.concat(action.id);
      const { type, ...newUploadFields } = action;
      return {
        ...state,
        imageOrder,
        imageUploads: state.imageUploads.setIn([action.id], {
          ...state.imageUploads[action.id],
          ...newUploadFields,
        }),
        numberOfUploads: imageAlreadyExists
          ? state.numberOfUploads
          : state.numberOfUploads + 1,
      };
    }
    case 'setFileUpload': {
      const fileAlreadyExists = state.fileUploads[action.id];
      if (!fileAlreadyExists && !action.file) return state;
      const fileOrder = fileAlreadyExists
        ? state.fileOrder
        : state.fileOrder.concat(action.id);
      const { type, ...newUploadFields } = action;
      return {
        ...state,
        fileOrder,
        fileUploads: state.fileUploads.setIn([action.id], {
          ...state.fileUploads[action.id],
          ...newUploadFields,
        }),
        numberOfUploads: fileAlreadyExists
          ? state.numberOfUploads
          : state.numberOfUploads + 1,
      };
    }
    case 'removeImageUpload':
      if (!state.imageUploads[action.id]) return state; // cannot remove anything
      return {
        ...state,
        numberOfUploads: state.numberOfUploads - 1,
        imageOrder: state.imageOrder.filter((_id) => _id !== action.id),
        imageUploads: state.imageUploads.without(action.id),
      };
    case 'removeFileUpload':
      if (!state.fileUploads[action.id]) return state; // cannot remove anything
      return {
        ...state,
        numberOfUploads: state.numberOfUploads - 1,
        fileOrder: state.fileOrder.filter((_id) => _id !== action.id),
        fileUploads: state.fileUploads.without(action.id),
      };
    case 'reduceNumberOfUploads': // TODO: figure out if we can just use uploadOrder instead
      return { ...state, numberOfUploads: state.numberOfUploads - 1 };
    case 'addMentionedUser':
      return {
        ...state,
        mentioned_users: state.mentioned_users.concat(action.user),
      };
    default:
      return state;
  }
}
/**
 * hook for MessageInput state
 * @type{import('types').useMessageInput}
 */
export default function useMessageInput(props) {
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
    publishTypingEvent,
  } = props;

  const [state, dispatch] = useReducer(messageInputReducer, message, initState);
  const textareaRef = useRef(
    /** @type {HTMLTextAreaElement | undefined} */ (undefined),
  );
  const emojiPickerRef = useRef(/** @type {HTMLDivElement | null} */ (null));
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
  const newCursorPosition = useRef(/** @type {number | null} */ (null));
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
    const textareaElement = textareaRef.current;
    if (textareaElement && newCursorPosition.current !== null) {
      textareaElement.selectionStart = newCursorPosition.current;
      textareaElement.selectionEnd = newCursorPosition.current;
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
      if (publishTypingEvent && newText && channel) {
        logChatPromiseExecution(channel.keystroke(), 'start typing event');
      }
    },
    [channel, publishTypingEvent],
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

  const getCommands = useCallback(() => channel?.getConfig()?.commands, [
    channel,
  ]);

  const getUsers = useCallback(() => {
    if (!channel) return [];
    return [
      ...Object.values(channel.state.members).map(({ user }) => user),
      ...Object.values(channel.state.watchers),
    ].filter(
      (_user, index, self) =>
        self.findIndex((user) => user?.id === _user?.id) === index, // filter out non-unique ids
    );
  }, [channel]);

  const onSelectItem = useCallback(
    /** @param {UserResponse} item */
    (item) => {
      dispatch({ type: 'addMentionedUser', user: item });
    },
    [],
  );

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
        type: getAttachmentTypeFromMime(upload.file.type),
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

  /**
   * @param {React.FormEvent | React.MouseEvent} event
   */
  const handleSubmit = (event) => {
    event.preventDefault();
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

    // Instead of checking if a user is still mentioned every time the text changes,
    // just filter out non-mentioned users before submit, which is cheaper
    // and allows users to easily undo any accidental deletion
    const actualMentionedUsers = Array.from(
      new Set(
        mentioned_users
          .filter(
            ({ name, id }) =>
              text.includes(`@${id}`) || text.includes(`@${name}`),
          )
          .map(({ id }) => id),
      ),
    );

    const updatedMessage = {
      text,
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers,
    };

    if (!!message && editMessage) {
      // TODO: Remove this line and show an error when submit fails
      if (clearEditingState) clearEditingState();

      const updateMessagePromise = editMessage({
        ...updatedMessage,
        id: message.id,
      }).then(clearEditingState);

      logChatPromiseExecution(updateMessagePromise, 'update message');
    } else if (
      overrideSubmitHandler &&
      typeof overrideSubmitHandler === 'function' &&
      channel
    ) {
      overrideSubmitHandler(
        {
          ...updatedMessage,
          parent,
        },
        channel.cid,
      );
      dispatch({ type: 'clear' });
    } else if (sendMessage) {
      const sendMessagePromise = sendMessage({
        ...updatedMessage,
        parent,
      });
      logChatPromiseExecution(sendMessagePromise, 'send message');
      dispatch({ type: 'clear' });
    }
    if (channel && publishTypingEvent)
      logChatPromiseExecution(channel.stopTyping(), 'stop typing');
  };

  // Attachments

  // Files

  const uploadFile = useCallback((id) => {
    dispatch({ type: 'setFileUpload', id, state: 'uploading' });
  }, []);

  const removeFile = useCallback((id) => {
    // TODO: cancel upload if still uploading
    dispatch({ type: 'removeFileUpload', id });
  }, []);

  useEffect(() => {
    (async () => {
      if (!channel) return;
      const upload = Object.values(fileUploads).find(
        (fileUpload) => fileUpload.state === 'uploading' && fileUpload.file,
      );
      if (!upload) return;

      const { id, file } = upload;
      /** @type FileUploadAPIResponse */
      let response;
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
          dispatch({ type: 'setFileUpload', id, state: 'failed' });
        }
        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the paramaters passed to the error handler actually make sense
          errorHandler(e, 'upload-file', file);
        }
        return;
      }

      // If doImageUploadRequest returns any falsy value, then don't create the upload preview.
      // This is for the case if someone wants to handle failure on app level.
      if (!response) {
        removeFile(id);
        return;
      }

      dispatch({
        type: 'setFileUpload',
        id,
        state: 'finished',
        url: response.file,
      });
    })();
  }, [fileUploads, channel, doFileUploadRequest, errorHandler, removeFile]);

  // Images

  const removeImage = useCallback((id) => {
    dispatch({ type: 'removeImageUpload', id });
    // TODO: cancel upload if still uploading
  }, []);

  const uploadImage = useCallback(
    async (id) => {
      const img = imageUploads[id];
      if (!img || !channel) return;
      const { file } = img;
      if (img.state !== 'uploading') {
        dispatch({ type: 'setImageUpload', id, state: 'uploading' });
      }
      /** @type FileUploadAPIResponse */
      let response;
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
          dispatch({ type: 'setImageUpload', id, state: 'failed' });
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

      // If doImageUploadRequest returns any falsy value, then don't create the upload preview.
      // This is for the case if someone wants to handle failure on app level.
      if (!response) {
        removeImage(id);
        return;
      }

      dispatch({
        type: 'setImageUpload',
        id,
        state: 'finished',
        url: response.file,
      });
    },
    [imageUploads, channel, doImageUploadRequest, errorHandler, removeImage],
  );

  useEffect(() => {
    if (FileReader) {
      const upload = Object.values(imageUploads).find(
        (imageUpload) =>
          imageUpload.state === 'uploading' &&
          !!imageUpload.file &&
          !imageUpload.previewUri,
      );
      if (upload) {
        const { id, file } = upload;
        // TODO: Possibly use URL.createObjectURL instead. However, then we need
        // to release the previews when not used anymore though.
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result !== 'string') return;
          dispatch({
            type: 'setImageUpload',
            id,
            previewUri: event.target.result,
          });
        };
        reader.readAsDataURL(file);
        uploadImage(id);
        return () => {
          reader.onload = null;
        };
      }
    }
    return () => {};
  }, [imageUploads, uploadImage]);

  // Number of files that the user can still add. Should never be more than the amount allowed by the API.
  // If multipleUploads is false, we only want to allow a single upload.
  const maxFilesAllowed = useMemo(() => {
    if (!channelContext.multipleUploads) return 1;
    if (channelContext.maxNumberOfFiles === undefined) {
      return apiMaxNumberOfFiles;
    }
    return channelContext.maxNumberOfFiles;
  }, [channelContext.maxNumberOfFiles, channelContext.multipleUploads]);

  const maxFilesLeft = maxFilesAllowed - numberOfUploads;

  const uploadNewFiles = useCallback(
    /**
     * @param {FileList} files
     */
    (files) => {
      Array.from(files)
        .slice(0, maxFilesLeft)
        .forEach((file) => {
          const id = generateRandomId();
          if (file.type.startsWith('image/')) {
            dispatch({ type: 'setImageUpload', id, file, state: 'uploading' });
          } else if (file instanceof File && !noFiles) {
            dispatch({ type: 'setFileUpload', id, file, state: 'uploading' });
          }
        });
    },
    [maxFilesLeft, noFiles],
  );

  const onPaste = useCallback(
    /** (e: React.ClipboardEvent) */
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
        /** @type {DataTransferItem} */
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

  const isUploadEnabled = channel?.getConfig?.()?.uploads !== false;

  return {
    ...state,
    isUploadEnabled,
    maxFilesLeft,
    // refs
    textareaRef,
    emojiPickerRef,
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
