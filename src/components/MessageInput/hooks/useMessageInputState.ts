import React, { Reducer, useCallback, useReducer, useState } from 'react';
import { nanoid } from 'nanoid';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';

import { useAttachments } from './useAttachments';
import { EnrichURLsController, useLinkPreviews } from './useLinkPreviews';
import { useMessageInputText } from './useMessageInputText';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';
import { RecordingController, useMediaRecorder } from '../../MediaRecorder/hooks/useMediaRecorder';
import { LinkPreviewState, SetLinkPreviewMode } from '../types';

import type {
  AnyLocalAttachment,
  FileUpload,
  ImageUpload,
  LinkPreviewMap,
  LocalAttachment,
} from '../types';
import type { FileLike } from '../../ReactFileUtilities';
import type { Attachment, Message, OGAttachment, UserResponse } from 'stream-chat';

import type { MessageInputProps } from '../MessageInput';

import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  SendMessageOptions,
} from '../../../types/types';
import { mergeDeep } from '../../../utils/mergeDeep';

export type MessageInputState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachments: LocalAttachment<StreamChatGenerics>[];
  fileOrder: string[];
  fileUploads: Record<string, FileUpload>;
  imageOrder: string[];
  imageUploads: Record<string, ImageUpload>;
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse<StreamChatGenerics>[];
  setText: (text: string) => void;
  text: string;
};

type UpsertAttachmentsAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachments: LocalAttachment<StreamChatGenerics>[];
  type: 'upsertAttachments';
};

type RemoveAttachmentsAction = {
  ids: string[];
  type: 'removeAttachments';
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

type SetLinkPreviewsAction = {
  linkPreviews: LinkPreviewMap;
  mode: SetLinkPreviewMode;
  type: 'setLinkPreviews';
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
  | SetTextAction
  | ClearAction
  | SetImageUploadAction
  | SetFileUploadAction
  | SetLinkPreviewsAction
  | RemoveImageUploadAction
  | RemoveFileUploadAction
  | AddMentionedUserAction<StreamChatGenerics>
  | UpsertAttachmentsAction
  | RemoveAttachmentsAction;

export type MessageInputHookProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = EnrichURLsController & {
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleSubmit: (
    event?: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  numberOfUploads: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectUser: (item: UserResponse<StreamChatGenerics>) => void;
  recordingController: RecordingController<StreamChatGenerics>;
  removeAttachments: (ids: string[]) => void;
  removeFile: (id: string) => void;
  removeImage: (id: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
  uploadAttachment: (
    attachment: AnyLocalAttachment<StreamChatGenerics>,
  ) => Promise<AnyLocalAttachment<StreamChatGenerics> | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles: (files: FileList | File[]) => void;
  upsertAttachments: (
    attachments: (Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>)[],
  ) => void;
};

const makeEmptyMessageInputState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): MessageInputState<StreamChatGenerics> => ({
  attachments: [],
  fileOrder: [],
  fileUploads: {},
  imageOrder: [],
  imageUploads: {},
  linkPreviews: new Map(),
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
            og_scrape_url, // fixme: why scraped content is mixed with uploaded content?
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

  const linkPreviews =
    message.attachments?.reduce<LinkPreviewMap>((acc, attachment) => {
      if (!attachment.og_scrape_url) return acc;
      acc.set(attachment.og_scrape_url, {
        ...(attachment as OGAttachment),
        state: LinkPreviewState.LOADED,
      });
      return acc;
    }, new Map()) ?? new Map();

  const imageOrder = Object.keys(imageUploads);
  const fileOrder = Object.keys(fileUploads);

  const attachments =
    message.attachments
      ?.filter(({ type }) => type !== 'file' && type !== 'image')
      .map(
        (att) =>
          ({
            ...att,
            localMetadata: { id: nanoid() },
          } as LocalAttachment<StreamChatGenerics>),
      ) || [];

  const mentioned_users: StreamMessage['mentioned_users'] = message.mentioned_users || [];

  return {
    attachments,
    fileOrder,
    fileUploads,
    imageOrder,
    imageUploads,
    linkPreviews,
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
    case 'setText':
      return { ...state, text: action.getNewText(state.text) };

    case 'clear':
      return makeEmptyMessageInputState();

    case 'upsertAttachments': {
      const attachments = [...state.attachments];
      action.attachments.forEach((actionAttachment) => {
        const attachmentIndex = state.attachments.findIndex(
          (att) =>
            att.localMetadata?.id && att.localMetadata?.id === actionAttachment.localMetadata?.id,
        );

        if (attachmentIndex === -1) {
          attachments.push(actionAttachment);
        } else {
          const upsertedAttachment = mergeDeep(
            state.attachments[attachmentIndex] ?? {},
            actionAttachment,
          );
          attachments.splice(attachmentIndex, 1, upsertedAttachment);
        }
      });

      return {
        ...state,
        attachments,
      };
    }

    case 'removeAttachments': {
      return {
        ...state,
        attachments: state.attachments.filter((att) => !action.ids.includes(att.localMetadata?.id)),
      };
    }

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

    case 'setLinkPreviews': {
      const linkPreviews = new Map(state.linkPreviews);

      if (action.mode === SetLinkPreviewMode.REMOVE) {
        Array.from(action.linkPreviews.keys()).forEach((key) => {
          linkPreviews.delete(key);
        });
      } else {
        Array.from(action.linkPreviews.values()).reduce<LinkPreviewMap>((acc, linkPreview) => {
          const existingPreview = acc.get(linkPreview.og_scrape_url);
          const alreadyEnqueued =
            linkPreview.state === LinkPreviewState.QUEUED &&
            existingPreview?.state !== LinkPreviewState.FAILED;

          if (existingPreview && alreadyEnqueued) return acc;
          acc.set(linkPreview.og_scrape_url, linkPreview);
          return acc;
        }, linkPreviews);

        if (action.mode === SetLinkPreviewMode.SET) {
          Array.from(state.linkPreviews.keys()).forEach((key) => {
            if (!action.linkPreviews.get(key)) linkPreviews.delete(key);
          });
        }
      }

      return {
        ...state,
        linkPreviews,
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
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingConfig,
    audioRecordingEnabled,
    getDefaultValue,
    message,
    urlEnrichmentConfig,
  } = props;

  const {
    channelCapabilities = {},
    channelConfig,
    enrichURLForPreview: enrichURLForPreviewChannelContext,
  } = useChannelStateContext<StreamChatGenerics>('useMessageInputState');

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

  const enrichURLsController = useLinkPreviews({
    dispatch,
    linkPreviews: state.linkPreviews,
    ...urlEnrichmentConfig,
    enrichURLForPreview:
      urlEnrichmentConfig?.enrichURLForPreview ?? enrichURLForPreviewChannelContext,
  });

  const { handleChange, insertText, textareaRef } = useMessageInputText<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
    enrichURLsController.findAndEnqueueURLsToEnrich,
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
    maxFilesLeft,
    numberOfUploads,
    removeAttachments,
    removeFile,
    removeImage,
    uploadAttachment,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachments,
  } = useAttachments<StreamChatGenerics, V>(props, state, dispatch, textareaRef);

  const { handleSubmit } = useSubmitHandler<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
    numberOfUploads,
    enrichURLsController,
  );
  const recordingController = useMediaRecorder({
    asyncMessagesMultiSendEnabled,
    enabled: !!audioRecordingEnabled,
    handleSubmit,
    recordingConfig: audioRecordingConfig,
    uploadAttachment,
  });

  // todo: remove the check for channelConfig?.uploads
  const isUploadEnabled =
    channelConfig?.uploads !== false && channelCapabilities['upload-file'] !== false;

  const { onPaste } = usePasteHandler(
    uploadNewFiles,
    insertText,
    isUploadEnabled,
    enrichURLsController.findAndEnqueueURLsToEnrich,
  );

  const onSelectUser = useCallback((item: UserResponse<StreamChatGenerics>) => {
    dispatch({ type: 'addMentionedUser', user: item });
  }, []);

  const setText = useCallback((text: string) => {
    dispatch({ getNewText: () => text, type: 'setText' });
  }, []);

  return {
    ...state,
    ...enrichURLsController,
    closeCommandsList,
    closeMentionsList,
    handleChange,
    handleSubmit,
    insertText,
    isUploadEnabled,
    maxFilesLeft,
    numberOfUploads,
    onPaste,
    onSelectUser,
    openCommandsList,
    openMentionsList,
    recordingController,
    removeAttachments,
    removeFile,
    removeImage,
    setText,
    showCommandsList,
    showMentionsList,
    textareaRef,
    uploadAttachment,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachments,
  };
};
