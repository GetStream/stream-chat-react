import React, { Reducer, useCallback, useReducer } from 'react';
import { dataTransferItemsHaveFiles, dataTransferItemsToFiles, FileLike } from 'react-file-utils';
import type { Attachment, UserResponse } from 'stream-chat';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { generateRandomId } from '../../../utils';

import { useEmojiIndex } from './useEmojiIndex';
import { useAttachments } from './useAttachments';
import { useMessageInputText } from './useMessageInputText';
import { useEmojiPicker } from './useEmojiPicker';
import { useSubmitHandler } from './useSubmitHandler';

import type { EmojiData, NimbleEmojiIndex } from 'emoji-mart';

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
type AddMentionedUserAction<Us extends DefaultUserType<Us> = DefaultUserType> = {
  type: 'addMentionedUser';
  user: UserResponse<Us>;
};

export type MessageInputReducerAction<Us extends DefaultUserType<Us> = DefaultUserType> =
  | SetEmojiPickerIsOpenAction
  | SetTextAction
  | ClearAction
  | SetImageUploadAction
  | SetFileUploadAction
  | RemoveImageUploadAction
  | RemoveFileUploadAction
  | ReduceNumberOfUploadsAction
  | AddMentionedUserAction<Us>;

export type MessageInputHookProps<Us extends DefaultUserType<Us> = DefaultUserType> = {
  closeEmojiPicker: React.MouseEventHandler<HTMLButtonElement>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement>;
  handleSubmit: (event: React.BaseSyntheticEvent) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectEmoji: (emoji: EmojiData) => void;
  onSelectUser: (item: UserResponse<Us>) => void;
  openEmojiPicker: React.MouseEventHandler<HTMLSpanElement>;
  removeFile: (id: string) => void;
  removeImage: (id: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles(files: FileList | File[]): void;
  emojiIndex?: NimbleEmojiIndex;
};
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
    message.attachments?.filter(({ type }) => type !== 'file' && type !== 'image') || [];

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
      const imageOrder = imageAlreadyExists ? state.imageOrder : state.imageOrder.concat(action.id);
      const newUploadFields = { ...action } as Partial<SetImageUploadAction>;
      delete newUploadFields.type;
      return {
        ...state,
        imageOrder,
        imageUploads: {
          ...state.imageUploads,
          [action.id]: { ...state.imageUploads[action.id], ...newUploadFields },
        },
        numberOfUploads: imageAlreadyExists ? state.numberOfUploads : state.numberOfUploads + 1,
      };
    }
    case 'setFileUpload': {
      const fileAlreadyExists = state.fileUploads[action.id];
      if (!fileAlreadyExists && !action.file) return state;
      const fileOrder = fileAlreadyExists ? state.fileOrder : state.fileOrder.concat(action.id);
      const newUploadFields = { ...action } as Partial<SetFileUploadAction>;
      delete newUploadFields.type;
      return {
        ...state,
        fileOrder,
        fileUploads: {
          ...state.fileUploads,
          [action.id]: { ...state.fileUploads[action.id], ...newUploadFields },
        },
        numberOfUploads: fileAlreadyExists ? state.numberOfUploads : state.numberOfUploads + 1,
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
export const useMessageInputState = <
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
): MessageInputState<At, Us> & MessageInputHookProps<Us> => {
  const { message } = props;

  const { channel } = useChannelStateContext<At, Ch, Co, Ev, Me, Re, Us>();

  const [state, dispatch] = useReducer(
    messageInputReducer as Reducer<MessageInputState<At, Us>, MessageInputReducerAction<Us>>,
    message,
    initState,
  );

  const { handleChange, insertText, textareaRef } = useMessageInputText(props, state, dispatch);

  const {
    closeEmojiPicker,
    emojiPickerRef,
    handleEmojiKeyDown,
    onSelectEmoji,
    openEmojiPicker,
  } = useEmojiPicker(state, dispatch, insertText);

  const onSelectUser = useCallback((item: UserResponse<Us>) => {
    dispatch({ type: 'addMentionedUser', user: item });
  }, []);

  const { handleSubmit } = useSubmitHandler(props, state, dispatch);

  const {
    maxFilesLeft,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = useAttachments(props, state, dispatch);

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
    emojiIndex: useEmojiIndex(),
    emojiPickerRef,
    handleChange,
    handleEmojiKeyDown,
    handleSubmit,
    insertText,
    isUploadEnabled,
    maxFilesLeft,
    onPaste,
    onSelectEmoji,
    onSelectUser,
    openEmojiPicker,
    removeFile,
    removeImage,
    textareaRef,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
