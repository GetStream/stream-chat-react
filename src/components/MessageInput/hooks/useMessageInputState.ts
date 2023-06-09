import React, { Reducer, useCallback, useReducer, useState } from 'react';
import { nanoid } from 'nanoid';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';

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

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

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
  thumb_url?: string;
  url?: string;
};

export type ImageUpload<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
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
} & Pick<
  Attachment<StreamChatGenerics>,
  'og_scrape_url' | 'title' | 'title_link' | 'author_name' | 'text'
>;

export type MessageInputState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachments: Attachment<StreamChatGenerics>[];
  emojiPickerIsOpen: boolean;
  fileOrder: string[];
  fileUploads: Record<string, FileUpload>;
  imageOrder: string[];
  imageUploads: Record<string, ImageUpload>;
  mentioned_users: UserResponse<StreamChatGenerics>[];
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
  thumb_url?: string;
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

type AddMentionedUserAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  type: 'addMentionedUser';
  user: UserResponse<StreamChatGenerics>;
};

export type MessageInputReducerAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> =
  | SetEmojiPickerIsOpenAction
  | SetTextAction
  | ClearAction
  | SetImageUploadAction
  | SetFileUploadAction
  | RemoveImageUploadAction
  | RemoveFileUploadAction
  | AddMentionedUserAction<StreamChatGenerics>;

export type MessageInputHookProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  closeEmojiPicker: React.MouseEventHandler<HTMLElement>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement>;
  handleSubmit: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  numberOfUploads: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectEmoji: (emoji: EmojiData) => void;
  onSelectUser: (item: UserResponse<StreamChatGenerics>) => void;
  openEmojiPicker: React.MouseEventHandler<HTMLSpanElement>;
  removeFile: (id: string) => void;
  removeImage: (id: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles: (files: FileList | File[]) => void;
  emojiIndex?: NimbleEmojiIndex;
};

const makeEmptyMessageInputState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): MessageInputState<StreamChatGenerics> => ({
  attachments: [],
  emojiPickerIsOpen: false,
  fileOrder: [],
  fileUploads: {},
  imageOrder: [],
  imageUploads: {},
  mentioned_users: [],
  setText: () => null,
  text: '',
});

/**
 * Initializes the state. Empty if the message prop is falsy.
 */
const initState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  message?: Pick<StreamMessage<StreamChatGenerics>, 'attachments' | 'mentioned_users' | 'text'>,
): MessageInputState<StreamChatGenerics> => {
  if (!message) {
    return makeEmptyMessageInputState();
  }

  // if message prop is defined, get image uploads, file uploads, text, etc.
  const imageUploads =
    message.attachments
      ?.filter(({ type }) => type === 'image')
      .reduce<Record<string, ImageUpload>>(
        (
          acc,
          { author_name, fallback = '', image_url, og_scrape_url, text, title, title_link },
        ) => {
          const id = nanoid();
          acc[id] = {
            author_name,
            file: {
              name: fallback,
            },
            id,
            og_scrape_url,
            state: 'finished',
            text,
            title,
            title_link,
            url: image_url,
          };
          return acc;
        },
        {},
      ) ?? {};

  const fileUploads =
    message.attachments
      ?.filter(({ type }) => type === 'file')
      .reduce<Record<string, FileUpload>>(
        (acc, { asset_url, file_size, mime_type, thumb_url, title = '' }) => {
          const id = nanoid();
          acc[id] = {
            file: {
              name: title,
              size: file_size,
              type: mime_type,
            },
            id,
            state: 'finished',
            thumb_url,
            url: asset_url,
          };
          return acc;
        },
        {},
      ) ?? {};

  const imageOrder = Object.keys(imageUploads);
  const fileOrder = Object.keys(fileUploads);

  const attachments =
    message.attachments?.filter(({ type }) => type !== 'file' && type !== 'image') || [];

  const mentioned_users: StreamMessage['mentioned_users'] = message.mentioned_users || [];

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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: MessageInputState<StreamChatGenerics>,
  action: MessageInputReducerAction<StreamChatGenerics>,
) => {
  switch (action.type) {
    case 'setEmojiPickerIsOpen':
      return { ...state, emojiPickerIsOpen: action.value };

    case 'setText':
      return { ...state, text: action.getNewText(state.text) };

    case 'clear':
      return makeEmptyMessageInputState();

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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
): MessageInputState<StreamChatGenerics> &
  MessageInputHookProps<StreamChatGenerics> &
  CommandsListState &
  MentionsListState => {
  const { additionalTextareaProps, closeEmojiPickerOnClick, getDefaultValue, message } = props;

  const { channelCapabilities = {}, channelConfig } = useChannelStateContext<StreamChatGenerics>(
    'useMessageInputState',
  );

  const defaultValue = getDefaultValue?.() || additionalTextareaProps?.defaultValue;
  const initialStateValue =
    message ||
    ((Array.isArray(defaultValue)
      ? { text: defaultValue.join('') }
      : { text: defaultValue?.toString() }) as Partial<StreamMessage<StreamChatGenerics>>);

  const [state, dispatch] = useReducer(
    messageInputReducer as Reducer<
      MessageInputState<StreamChatGenerics>,
      MessageInputReducerAction<StreamChatGenerics>
    >,
    initialStateValue,
    initState,
  );

  const { handleChange, insertText, textareaRef } = useMessageInputText<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
  );

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
      getNewText: (currentText) => currentText + '@',
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
  } = useEmojiPicker<StreamChatGenerics>(
    state,
    dispatch,
    insertText,
    textareaRef,
    closeEmojiPickerOnClick,
  );

  const {
    maxFilesLeft,
    numberOfUploads,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
  } = useAttachments<StreamChatGenerics, V>(props, state, dispatch, textareaRef);

  const { handleSubmit } = useSubmitHandler<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
    numberOfUploads,
  );
  const isUploadEnabled =
    channelConfig?.uploads !== false && channelCapabilities['upload-file'] !== false;

  const { onPaste } = usePasteHandler(uploadNewFiles, insertText, isUploadEnabled);

  const onSelectUser = useCallback((item: UserResponse<StreamChatGenerics>) => {
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
