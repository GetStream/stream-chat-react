import React, {
  Reducer,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';
import {
  dataTransferItemsHaveFiles,
  dataTransferItemsToFiles,
  FileLike,
} from 'react-file-utils';
import {
  Attachment,
  CommandResponse,
  logChatPromiseExecution,
  MessageResponse,
  SendFileAPIResponse,
  UpdatedMessage,
  UserResponse,
} from 'stream-chat';

import {
  StreamMessage,
  useChannelContext,
} from '../../../context/ChannelContext';
import { generateRandomId } from '../../../utils';

import type { BaseEmoji, EmojiData } from 'emoji-mart';

import type { MessageInputProps } from '../MessageInput';

import type {
  CustomTrigger,
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../../types/types';

export type FileUpload = {
  file: {
    name: string;
    size?: number | string;
    type?: string;
    uri?: string;
  };
  id: string;
  state: 'finished' | 'failed' | 'uploading';
  url?: string;
};

export type ImageUpload = {
  file: {
    height?: number;
    name?: string;
    uri?: string;
    width?: number;
  };
  id: string;
  state: 'finished' | 'failed' | 'uploading';
  previewUri?: string;
  url?: string;
};

export type MessageInputState<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  attachments: Attachment<At>[];
  emojiPickerIsOpen: boolean;
  fileOrder: string[];
  fileUploads: { [id: string]: FileUpload };
  imageOrder: string[];
  imageUploads: {
    [id: string]: ImageUpload;
  };
  // ids of users mentioned in message
  mentioned_users: UserResponse<Us>[];
  numberOfUploads: number;
  text: string;
};

type SetEmojiPickerIsOpenAction = {
  type: 'setEmojiPickerIsOpen';
  value: boolean;
};
type SetTextAction = {
  getNewText: (currentStateText: string) => string;
  type: 'setText';
};
type ClearAction = {
  type: 'clear';
};
type SetImageUploadAction = {
  id: string;
  type: 'setImageUpload';
  file?: File | FileLike;
  previewUri?: string;
  state?: string;
  url?: string;
};
type SetFileUploadAction = {
  id: string;
  type: 'setFileUpload';
  file?: File;
  state?: string;
  url?: string;
};
type RemoveImageUploadAction = {
  id: string;
  type: 'removeImageUpload';
};
type RemoveFileUploadAction = {
  id: string;
  type: 'removeFileUpload';
};
type ReduceNumberOfUploadsAction = {
  type: 'reduceNumberOfUploads';
};
type AddMentionedUserAction<
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  type: 'addMentionedUser';
  user: UserResponse<Us>;
};

export type MessageInputReducerAction<
  Us extends DefaultUserType<Us> = DefaultUserType
> =
  | SetEmojiPickerIsOpenAction
  | SetTextAction
  | ClearAction
  | SetImageUploadAction
  | SetFileUploadAction
  | RemoveImageUploadAction
  | RemoveFileUploadAction
  | ReduceNumberOfUploadsAction
  | AddMentionedUserAction<Us>;

export type MessageInputHookProps<
  Co extends DefaultCommandType = DefaultCommandType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  closeEmojiPicker: React.MouseEventHandler<HTMLButtonElement>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  getCommands: () => CommandResponse<Co>[] | undefined;
  getUsers: () => (UserResponse<Us> | undefined)[];
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement>;
  handleSubmit: React.FormEventHandler<HTMLFormElement>;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectEmoji: (emoji: EmojiData) => void;
  onSelectItem: (item: UserResponse<Us>) => void;
  openEmojiPicker: React.MouseEventHandler<HTMLSpanElement>;
  removeFile: (id: string) => void;
  removeImage: (id: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles(files: FileList | File[]): void;
};

/**
 * Get attachment type from MIME type
 */
const getAttachmentTypeFromMime = (mime: string) => {
  if (mime.includes('video/')) return 'media';
  if (mime.includes('audio/')) return 'audio';
  return 'file';
};

const apiMaxNumberOfFiles = 10;
const emptyFileUploads: Record<string, FileUpload> = {};
const emptyImageUploads: Record<string, ImageUpload> = {};

/**
 * Initializes the state. Empty if the message prop is falsy.
 */
const initState = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  message?: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>,
): MessageInputState<At, Us> => {
  if (!message) {
    return {
      attachments: [],
      emojiPickerIsOpen: false,
      fileOrder: [],
      fileUploads: { ...emptyFileUploads },
      imageOrder: [],
      imageUploads: { ...emptyImageUploads },
      mentioned_users: [],
      numberOfUploads: 0,
      text: '',
    };
  }

  // if message prop is defined, get image uploads, file uploads, text, etc. from it
  const imageUploads =
    message.attachments
      ?.filter(({ type }) => type === 'image')
      .reduce((acc, attachment) => {
        const id = generateRandomId();
        acc[id] = {
          file: {
            name: attachment.fallback,
          },
          id,
          state: 'finished',
          url: attachment.image_url,
        };
        return acc;
      }, {} as Record<string, ImageUpload>) || {};
  const imageOrder = Object.keys(imageUploads);

  const fileUploads =
    message.attachments
      ?.filter(({ type }) => type === 'file')
      .reduce((acc, attachment) => {
        const id = generateRandomId();
        acc[id] = {
          file: {
            name: attachment.title || '',
            size: attachment.file_size,
            type: attachment.mime_type,
          },
          id,
          state: 'finished',
          url: attachment.asset_url,
        };
        return acc;
      }, {} as Record<string, FileUpload>) || {};
  const fileOrder = Object.keys(fileUploads);

  const numberOfUploads = fileOrder.length + imageOrder.length;

  const attachments =
    message.attachments?.filter(
      ({ type }) => type !== 'file' && type !== 'image',
    ) || [];

  const mentioned_users = message.mentioned_users || [];

  return {
    attachments,
    emojiPickerIsOpen: false,
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    mentioned_users,
    numberOfUploads,
    text: message.text || '',
  };
};

/**
 * MessageInput state reducer
 */
const messageInputReducer = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  state: MessageInputState<At, Us>,
  action: MessageInputReducerAction<Us>,
) => {
  switch (action.type) {
    case 'setEmojiPickerIsOpen':
      return { ...state, emojiPickerIsOpen: action.value };
    case 'setText':
      return { ...state, text: action.getNewText(state.text) };
    case 'clear':
      return {
        attachments: [],
        emojiPickerIsOpen: false,
        fileOrder: [],
        fileUploads: { ...emptyFileUploads },
        imageOrder: [],
        imageUploads: { ...emptyImageUploads },
        mentioned_users: [],
        numberOfUploads: 0,
        text: '',
      };
    case 'setImageUpload': {
      const imageAlreadyExists = state.imageUploads[action.id];
      if (!imageAlreadyExists && !action.file) return state;
      const imageOrder = imageAlreadyExists
        ? state.imageOrder
        : state.imageOrder.concat(action.id);
      const newUploadFields = { ...action } as Partial<SetImageUploadAction>;
      delete newUploadFields.type;
      return {
        ...state,
        imageOrder,
        imageUploads: {
          ...state.imageUploads,
          [action.id]: { ...state.imageUploads[action.id], ...newUploadFields },
        },
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
      const newUploadFields = { ...action } as Partial<SetFileUploadAction>;
      delete newUploadFields.type;
      return {
        ...state,
        fileOrder,
        fileUploads: {
          ...state.fileUploads,
          [action.id]: { ...state.fileUploads[action.id], ...newUploadFields },
        },
        numberOfUploads: fileAlreadyExists
          ? state.numberOfUploads
          : state.numberOfUploads + 1,
      };
    }
    case 'removeImageUpload': {
      if (!state.imageUploads[action.id]) return state; // cannot remove anything
      const newImageUploads = { ...state.imageUploads };
      delete newImageUploads[action.id];
      return {
        ...state,
        imageOrder: state.imageOrder.filter((_id) => _id !== action.id),
        imageUploads: newImageUploads,
        numberOfUploads: state.numberOfUploads - 1,
      };
    }
    case 'removeFileUpload': {
      if (!state.fileUploads[action.id]) return state; // cannot remove anything
      const newFileUploads = { ...state.fileUploads };
      delete newFileUploads[action.id];
      return {
        ...state,
        fileOrder: state.fileOrder.filter((_id) => _id !== action.id),
        fileUploads: newFileUploads,
        numberOfUploads: state.numberOfUploads - 1,
      };
    }
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
};

/**
 * hook for MessageInput state
 */
export const useMessageInput = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<At, Ch, Co, Ev, Me, Re, Us, V>,
): MessageInputState<At, Us> & MessageInputHookProps<Co, Us> => {
  const {
    additionalTextareaProps,
    clearEditingState,
    doFileUploadRequest,
    doImageUploadRequest,
    errorHandler,
    focus,
    message,
    noFiles,
    overrideSubmitHandler,
    parent,
    publishTypingEvent,
  } = props;

  const {
    channel,
    editMessage,
    maxNumberOfFiles,
    multipleUploads,
    sendMessage,
  } = useChannelContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [state, dispatch] = useReducer(
    messageInputReducer as Reducer<
      MessageInputState<At, Us>,
      MessageInputReducerAction<Us>
    >,
    message,
    initState,
  );

  const {
    attachments,
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    mentioned_users,
    numberOfUploads,
    text,
  } = state;

  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>();

  // Focus
  useEffect(() => {
    if (focus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [focus]);

  // Text + cursor position
  const newCursorPosition = useRef<number>();

  const insertText = useCallback(
    (textToInsert: string) => {
      const { maxLength } = additionalTextareaProps || {};

      if (!textareaRef.current) {
        dispatch({
          getNewText: (text) => {
            const updatedText = text + textToInsert;
            if (maxLength && updatedText.length > maxLength) {
              return updatedText.slice(0, maxLength);
            }
            return updatedText;
          },
          type: 'setText',
        });
        return;
      }

      const { selectionEnd, selectionStart } = textareaRef.current;
      newCursorPosition.current = selectionStart + textToInsert.length;

      dispatch({
        getNewText: (prevText) => {
          const updatedText =
            prevText.slice(0, selectionStart) +
            textToInsert +
            prevText.slice(selectionEnd);

          if (maxLength && updatedText.length > maxLength) {
            return updatedText.slice(0, maxLength);
          }

          return updatedText;
        },
        type: 'setText',
      });
    },
    [additionalTextareaProps, newCursorPosition, textareaRef],
  );

  useEffect(() => {
    const textareaElement = textareaRef.current;
    if (textareaElement && newCursorPosition.current !== undefined) {
      textareaElement.selectionStart = newCursorPosition.current;
      textareaElement.selectionEnd = newCursorPosition.current;
      newCursorPosition.current = undefined;
    }
  }, [text, newCursorPosition]);

  const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = useCallback(
    (event) => {
      event.preventDefault();
      if (!event || !event.target) {
        return;
      }

      const newText = event.target.value;
      dispatch({
        getNewText: () => newText,
        type: 'setText',
      });
      if (publishTypingEvent && newText && channel) {
        logChatPromiseExecution(
          channel.keystroke(parent?.id),
          'start typing event',
        );
      }
    },
    [channel, parent, publishTypingEvent],
  );

  // Emoji

  const closeEmojiPicker = useCallback(
    (event: MouseEvent) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        dispatch({
          type: 'setEmojiPickerIsOpen',
          value: false,
        });
      }
    },
    [emojiPickerRef],
  );

  const openEmojiPicker: React.MouseEventHandler<HTMLSpanElement> = useCallback(
    (event) => {
      dispatch({
        type: 'setEmojiPickerIsOpen',
        value: true,
      });

      // Prevent event from bubbling to document, so the close handler is never called for this event
      event.stopPropagation();
    },
    [],
  );

  const handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement> = (
    event,
  ) => {
    if (
      event.key === ' ' ||
      event.key === 'Enter' ||
      event.key === 'Spacebar'
    ) {
      event.preventDefault();
      /**
       * TODO: fix the below at some point because this type casting is wrong
       * and just forced to not have warnings currently with the unknown casting
       */
      openEmojiPicker(
        (event as unknown) as React.MouseEvent<HTMLSpanElement, MouseEvent>,
      );
    }
  };

  const handleEmojiEscape = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      dispatch({
        type: 'setEmojiPickerIsOpen',
        value: false,
      });
    }
  };

  useEffect(() => {
    if (state.emojiPickerIsOpen) {
      document.addEventListener('click', closeEmojiPicker, false);
      document.addEventListener('keydown', handleEmojiEscape);
    }
    return () => {
      document.removeEventListener('click', closeEmojiPicker, false);
      document.removeEventListener('keydown', handleEmojiEscape);
    };
  }, [closeEmojiPicker, state.emojiPickerIsOpen]);

  const onSelectEmoji = useCallback(
    (emoji: EmojiData) => insertText((emoji as BaseEmoji).native),
    [insertText],
  );

  // Commands / mentions

  const getCommands = useCallback(() => channel?.getConfig?.()?.commands, [
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

  const onSelectItem = useCallback((item: UserResponse<Us>) => {
    dispatch({ type: 'addMentionedUser', user: item });
  }, []);

  // Submitting

  const getAttachmentsFromUploads = useCallback(() => {
    const imageAttachments = imageOrder
      .map((id) => imageUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .filter((
        { id, url },
        _,
        self, // filter out duplicates based on url
      ) => self.every((upload) => upload.id === id || upload.url !== url))
      .map(
        (upload) =>
          ({
            fallback: upload.file.name,
            image_url: upload.url,
            type: 'image',
          } as Attachment<At>),
      );

    const fileAttachments = fileOrder
      .map((id) => fileUploads[id])
      .filter((upload) => upload.state !== 'failed')
      .map(
        (upload) =>
          ({
            asset_url: upload.url,
            file_size: upload.file.size,
            mime_type: upload.file.type,
            title: upload.file.name,
            type: getAttachmentTypeFromMime(upload.file.type || ''),
          } as Attachment<At>),
      );

    return [
      ...attachments, // from state
      ...imageAttachments,
      ...fileAttachments,
    ];
  }, [imageOrder, imageUploads, fileOrder, fileUploads, attachments]);

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
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
            ({ id, name }) =>
              text.includes(`@${id}`) || text.includes(`@${name}`),
          )
          .map(({ id }) => id),
      ),
    );

    const updatedMessage = {
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers,
      text,
    };

    if (!!message && editMessage) {
      // TODO: Remove this line and show an error when submit fails
      if (clearEditingState) {
        clearEditingState();
      }

      const updateMessagePromise = editMessage(({
        ...updatedMessage,
        id: message.id,
      } as unknown) as UpdatedMessage<At, Ch, Co, Me, Re, Us>).then(
        clearEditingState,
      );

      logChatPromiseExecution(updateMessagePromise, 'update message');
      dispatch({ type: 'clear' });
    } else if (overrideSubmitHandler && channel) {
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
        parent: parent as MessageResponse<At, Ch, Co, Me, Re, Us>,
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
    dispatch({ id, state: 'uploading', type: 'setFileUpload' });
  }, []);

  const removeFile = useCallback((id) => {
    // TODO: cancel upload if still uploading
    dispatch({ id, type: 'removeFileUpload' });
  }, []);

  useEffect(() => {
    (async () => {
      if (!channel) return;
      const upload = Object.values(fileUploads).find(
        (fileUpload) => fileUpload.state === 'uploading' && fileUpload.file,
      );
      if (!upload) return;

      const { file, id } = upload;
      /** @type FileUploadAPIResponse */
      let response;
      try {
        if (doFileUploadRequest) {
          response = await doFileUploadRequest(file, channel);
        } else {
          response = await channel.sendFile(file as File);
        }
      } catch (error) {
        console.warn(error);
        let alreadyRemoved = false;

        dispatch({ type: 'reduceNumberOfUploads' });
        if (!fileUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ id, state: 'failed', type: 'setFileUpload' });
        }
        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the parameters passed to the error handler actually make sense
          errorHandler(error, 'upload-file', file);
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
        id,
        state: 'finished',
        type: 'setFileUpload',
        url: response.file,
      });
    })();
  }, [fileUploads, channel, doFileUploadRequest, errorHandler, removeFile]);

  // Images

  const removeImage = useCallback((id) => {
    dispatch({ id, type: 'removeImageUpload' });
    // TODO: cancel upload if still uploading
  }, []);

  const uploadImage = useCallback(
    async (id) => {
      const img = imageUploads[id];
      if (!img || !channel) return;
      const { file } = img;
      if (img.state !== 'uploading') {
        dispatch({ id, state: 'uploading', type: 'setImageUpload' });
      }
      let response: SendFileAPIResponse;
      try {
        if (doImageUploadRequest) {
          response = await doImageUploadRequest(file, channel);
        } else {
          response = await channel.sendImage(file as File);
        }
      } catch (error) {
        console.warn(error);
        let alreadyRemoved = false;
        dispatch({ type: 'reduceNumberOfUploads' });
        if (!imageUploads[id]) {
          alreadyRemoved = true;
        } else {
          dispatch({ id, state: 'failed', type: 'setImageUpload' });
        }
        if (!alreadyRemoved && errorHandler) {
          // TODO: verify if the parameters passed to the error handler actually make sense
          errorHandler(error, 'upload-image', {
            ...file,
            id,
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
        id,
        state: 'finished',
        type: 'setImageUpload',
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
        const { file, id } = upload;
        // TODO: Possibly use URL.createObjectURL instead. However, then we need
        // to release the previews when not used anymore though.
        const reader = new FileReader();
        reader.onload = (event) => {
          if (typeof event.target?.result !== 'string') return;
          dispatch({
            id,
            previewUri: event.target.result,
            type: 'setImageUpload',
          });
        };
        reader.readAsDataURL(file as Blob);
        uploadImage(id);
        return () => {
          reader.onload = null;
        };
      }
    }
    return;
  }, [imageUploads, uploadImage]);

  // Number of files that the user can still add. Should never be more than the amount allowed by the API.
  // If multipleUploads is false, we only want to allow a single upload.
  const maxFilesAllowed = useMemo(
    () => (!multipleUploads ? 1 : maxNumberOfFiles || apiMaxNumberOfFiles),
    [maxNumberOfFiles, multipleUploads],
  );

  // return !multipleUploads ? 1 : maxNumberOfFiles || apiMaxNumberOfFiles;
  const maxFilesLeft = maxFilesAllowed - numberOfUploads;

  const uploadNewFiles = useCallback(
    (files: FileList | File[] | FileLike[]) => {
      Array.from(files)
        .slice(0, maxFilesLeft)
        .forEach((file) => {
          const id = generateRandomId();
          if (
            file.type.startsWith('image/') &&
            !file.type.endsWith('.photoshop') // photoshop files begin with 'image/'
          ) {
            dispatch({ file, id, state: 'uploading', type: 'setImageUpload' });
          } else if (file instanceof File && !noFiles) {
            dispatch({ file, id, state: 'uploading', type: 'setFileUpload' });
          }
        });
    },
    [maxFilesLeft, noFiles],
  );

  const onPaste = useCallback(
    (clipboardEvent: React.ClipboardEvent<HTMLTextAreaElement>) => {
      (async (event) => {
        // TODO: Move this handler to package with ImageDropzone
        const { items } = event.clipboardData;
        if (!dataTransferItemsHaveFiles(Array.from(items))) return;

        event.preventDefault();
        // Get a promise for the plain text in case no files are
        // found. This needs to be done here because chrome cleans
        // up the DataTransferItems after resolving of a promise.
        let plainTextPromise: Promise<string> | undefined = undefined;
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.kind === 'string' && item.type === 'text/plain') {
            plainTextPromise = new Promise((resolve) => {
              item.getAsString((string) => {
                resolve(string);
              });
            });
            break;
          }
        }

        const fileLikes = await dataTransferItemsToFiles(Array.from(items));
        if (fileLikes.length) {
          uploadNewFiles(fileLikes);
          return;
        }

        // fallback to regular text paste
        if (plainTextPromise) {
          const pastedText = await plainTextPromise;
          insertText(pastedText);
        }
      })(clipboardEvent);
    },
    [insertText, uploadNewFiles],
  );

  const isUploadEnabled = channel?.getConfig?.()?.uploads !== false;

  return {
    ...state,
    /**
     * TODO: fix the below at some point because this type casting is wrong
     * and just forced to not have warnings currently with the unknown casting
     */
    closeEmojiPicker: (closeEmojiPicker as unknown) as React.MouseEventHandler<HTMLSpanElement>,
    emojiPickerRef,
    getCommands,
    getUsers,
    handleChange,
    handleEmojiKeyDown,
    handleSubmit,
    insertText,
    isUploadEnabled,
    maxFilesLeft,
    onPaste,
    onSelectEmoji,
    onSelectItem,
    openEmojiPicker,
    removeFile,
    removeImage,
    textareaRef,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
