import React, { Reducer, useCallback, useReducer, useState } from 'react';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';
import { generateRandomId } from '../../../utils';

import { useEmojiIndex } from './useEmojiIndex';
import { useAttachments } from './useAttachments';
import { useMessageInputText } from './useMessageInputText';
import { useEmojiPicker } from './useEmojiPicker';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';

import type { EmojiData, NimbleEmojiIndex } from 'emoji-mart';
import type { FileLike } from 'react-file-utils';
import type { Attachment, Message, UserResponse } from 'stream-chat';

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
} from '../../../types/types';

export type FileUpload = {
  file: {
    name: string;
    lastModified?: number;
    lastModifiedDate?: Date;
    size?: number;
    type?: string;
    uri?: string;
  };
  id: string;
  state: 'finished' | 'failed' | 'uploading';
  url?: string;
};

export type ImageUpload = {
  file: {
    name: string;
    height?: number;
    lastModified?: number;
    lastModifiedDate?: Date;
    size?: number;
    type?: string;
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
  imageUploads: { [id: string]: ImageUpload };
  mentioned_users: UserResponse<Us>[];
  setText: (text: string) => void;
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
  | AddMentionedUserAction<Us>;

export type MessageInputHookProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Me extends DefaultMessageType = DefaultMessageType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  closeEmojiPicker: React.MouseEventHandler<HTMLElement>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement>;
  handleSubmit: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<At, Me, Us>>,
  ) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  numberOfUploads: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectEmoji: (emoji: EmojiData) => void;
  onSelectUser: (item: UserResponse<Us>) => void;
  openEmojiPicker: React.MouseEventHandler<HTMLSpanElement>;
  removeFile: (id: string) => void;
  removeImage: (id: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles: (files: FileList | File[]) => void;
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
      setText: () => null,
      text: '',
    };
  }

  // if message prop is defined, get image uploads, file uploads, text, etc.
  const imageUploads =
    message.attachments
      ?.filter(({ type }) => type === 'image')
      .reduce((acc, attachment) => {
        const id = generateRandomId();
        acc[id] = {
          file: {
            name: attachment.fallback || '',
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
    setText: () => null,
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
      };
    }

    case 'addMentionedUser':
      return {
        ...state,
        mentioned_users: state.mentioned_users.concat(action.user),
      };

    default:
      return state;
  }
};

export type CommandsListState = {
  closeCommandsList: () => void;
  openCommandsList: () => void;
  showCommandsList: boolean;
};

export type MentionsListState = {
  closeMentionsList: () => void;
  openMentionsList: () => void;
  showMentionsList: boolean;
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
): MessageInputState<At, Us> &
  MessageInputHookProps<At, Me, Us> &
  CommandsListState &
  MentionsListState => {
  const { message } = props;

  const { channelCapabilities = {}, channelConfig } = useChannelStateContext<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us
  >('useMessageInputState');

  const [state, dispatch] = useReducer(
    messageInputReducer as Reducer<MessageInputState<At, Us>, MessageInputReducerAction<Us>>,
    message,
    initState,
  );

  const { handleChange, insertText, textareaRef } = useMessageInputText<
    At,
    Ch,
    Co,
    Ev,
    Me,
    Re,
    Us,
    V
  >(props, state, dispatch);

  const [showCommandsList, setShowCommandsList] = useState(false);
  const [showMentionsList, setShowMentionsList] = useState(false);

  const openCommandsList = () => {
    dispatch({
      getNewText: () => '/',
      type: 'setText',
    });
    setShowCommandsList(true);
  };

  const closeCommandsList = () => setShowCommandsList(false);

  const openMentionsList = () => {
    dispatch({
      getNewText: () => '@',
      type: 'setText',
    });
    setShowMentionsList(true);
  };

  const closeMentionsList = () => setShowMentionsList(false);

  const {
    closeEmojiPicker,
    emojiPickerRef,
    handleEmojiKeyDown,
    onSelectEmoji,
    openEmojiPicker,
  } = useEmojiPicker<At, Us>(state, dispatch, insertText);

  const {
    maxFilesLeft,
    numberOfUploads,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = useAttachments<At, Ch, Co, Ev, Me, Re, Us, V>(props, state, dispatch);

  const { handleSubmit } = useSubmitHandler<At, Ch, Co, Ev, Me, Re, Us, V>(
    props,
    state,
    dispatch,
    numberOfUploads,
  );

  const { onPaste } = usePasteHandler(uploadNewFiles, insertText);

  const isUploadEnabled =
    channelConfig?.uploads !== false && channelCapabilities['upload-file'] !== false;

  const onSelectUser = useCallback((item: UserResponse<Us>) => {
    dispatch({ type: 'addMentionedUser', user: item });
  }, []);

  const setText = useCallback((text: string) => {
    dispatch({ getNewText: () => text, type: 'setText' });
  }, []);

  return {
    ...state,
    closeCommandsList,
    /**
     * TODO: fix the below at some point because this type casting is wrong
     * and just forced to not have warnings currently with the unknown casting
     */
    closeEmojiPicker: (closeEmojiPicker as unknown) as React.MouseEventHandler<HTMLSpanElement>,
    closeMentionsList,
    emojiIndex: useEmojiIndex(),
    emojiPickerRef,
    handleChange,
    handleEmojiKeyDown,
    handleSubmit,
    insertText,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    onPaste,
    onSelectEmoji,
    onSelectUser,
    openCommandsList,
    openEmojiPicker,
    openMentionsList,
    removeFile,
    removeImage,
    setText,
    showCommandsList,
    showMentionsList,
    textareaRef,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  };
};
