import React, { Reducer, useCallback, useReducer, useRef, useState } from 'react';
import { nanoid } from 'nanoid';

import { StreamMessage, useChannelStateContext } from '../../../context/ChannelStateContext';

import { useEmojiIndex } from './useEmojiIndex';
import {
  isLinkPreview,
  isMessageComposerFileAttachment,
  isMessageComposerImageAttachment,
  isUploadAttachment,
  useAttachments,
} from './useAttachments';
import { useMessageInputText } from './useMessageInputText';
import { useEmojiPicker } from './useEmojiPicker';
import { EnrichURLsController, useLinkPreviews } from './useLinkPreviews';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';

import type { EmojiData, NimbleEmojiIndex } from 'emoji-mart';
import type { Message, UserResponse } from 'stream-chat';

import type { MessageInputProps } from '../MessageInput';
import { isScrapedContent, isUploadedImage } from '../../Attachment';
import {
  attachmentToFileUpload,
  attachmentToImageUpload,
  messageComposerAttachmentToFileUpload,
  messageComposerAttachmentToImageUpload,
} from '../attachmentTransformers';

import {
  FileUpload,
  ImageUpload,
  LinkPreview,
  LinkPreviewMap,
  LinkPreviewState,
  MessageComposerAttachment,
  SetLinkPreviewMode,
  UploadState,
} from '../types';
import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  SendMessageOptions,
} from '../../../types/types';

type FileUploads = Record<string, FileUpload>; // should be removed with version v12
type ImageUploads = Record<string, ImageUpload>; // should be removed with version v12

export type MessageInputState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachments: MessageComposerAttachment<StreamChatGenerics>[];
  emojiPickerIsOpen: boolean;
  /* @deprecated use attachments to access message composer attachments state instead, attachment order is kept in a Map. */
  fileOrder: string[];
  /* @deprecated use attachments to access message composer attachments state instead */
  fileUploads: FileUploads;
  /* @deprecated use attachments to access message composer attachments state instead, attachment order is kept in a Map */
  imageOrder: string[];
  /* @deprecated use attachments to access message composer attachments state instead */
  imageUploads: ImageUploads;
  /* @deprecated use attachments to access message composer attachments state instead */
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse<StreamChatGenerics>[];
  setText: (text: string) => void;
  text: string;
};

type UpsertAttachmentAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  attachment: MessageComposerAttachment<StreamChatGenerics>;
  type: 'upsertAttachment';
};

type RemoveAttachmentAction = {
  id: string;
  type: 'removeAttachment';
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

type SetLinkPreviewsAction = {
  linkPreviews: LinkPreviewMap;
  mode: SetLinkPreviewMode;
  type: 'setLinkPreviews';
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
  | UpsertAttachmentAction
  | RemoveAttachmentAction
  | SetEmojiPickerIsOpenAction
  | SetTextAction
  | ClearAction
  | SetLinkPreviewsAction
  | AddMentionedUserAction<StreamChatGenerics>;

export type MessageInputHookProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = EnrichURLsController & {
  closeEmojiPicker: React.MouseEventHandler<HTMLElement>;
  emojiPickerRef: React.MutableRefObject<HTMLDivElement | null>;
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleEmojiKeyDown: React.KeyboardEventHandler<HTMLSpanElement>;
  handleSubmit: (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  // todo: remove when legacy components UploadsPreview, MessageInputSmall, MessageInputV1 are removed. Used only in legacy components
  numberOfUploads: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectEmoji: (emoji: EmojiData) => void;
  onSelectUser: (item: UserResponse<StreamChatGenerics>) => void;
  openEmojiPicker: React.MouseEventHandler<HTMLSpanElement>;
  removeAttachment: (id: string) => void;
  removeFile: (id: string) => void; // should be removed with version v12
  removeImage: (id: string) => void; // should be removed with version v12
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
  uploadFile: (id: string) => void;
  uploadImage: (id: string) => void;
  uploadNewFiles: (files: FileList | File[]) => void;
  upsertAttachment: (attachment: MessageComposerAttachment<StreamChatGenerics>) => void;
  emojiIndex?: NimbleEmojiIndex;
};

const makeEmptyMessageInputState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(): MessageInputState<StreamChatGenerics> => ({
  attachments: [],
  emojiPickerIsOpen: false,
  fileOrder: [], // should be removed with version v12
  fileUploads: {}, // should be removed with version v12
  imageOrder: [], // should be removed with version v12
  imageUploads: {}, // should be removed with version v12
  linkPreviews: new Map(), // should be removed with version v12
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

  const attachmentsSeed = {
    attachments: [],
    fileUploads: {}, // should be removed with version v12
    imageUploads: {}, // should be removed with version v12
    linkPreviews: new Map(), // should be removed with version v12
  };

  const { attachments, fileUploads, imageUploads, linkPreviews } =
    message.attachments?.reduce<{
      attachments: MessageComposerAttachment<StreamChatGenerics>[]; // should be removed with version v12
      fileUploads: Record<string, FileUpload>; // should be removed with version v12
      imageUploads: Record<string, ImageUpload>; // should be removed with version v12
      linkPreviews: LinkPreviewMap;
    }>((acc, attachment) => {
      const id = nanoid();
      const attachmentWithId: MessageComposerAttachment<StreamChatGenerics> = {
        ...attachment,
        id: attachment.id || id,
      };
      if (isScrapedContent(attachmentWithId)) {
        const linkPreview = {
          ...attachmentWithId,
          state: LinkPreviewState.LOADED,
        };
        acc.linkPreviews.set(linkPreview.og_scrape_url, linkPreview);
        acc.attachments.push(linkPreview);
      } else {
        acc.attachments.push({ ...attachmentWithId, uploadState: UploadState.finished });
      }

      // should be removed with version v12
      if (isUploadedImage(attachmentWithId)) {
        acc.imageUploads[id] = attachmentToImageUpload(attachmentWithId);
      } else if (isMessageComposerFileAttachment(attachmentWithId)) {
        acc.fileUploads[id] = attachmentToFileUpload(attachmentWithId);
      }

      return acc;
    }, attachmentsSeed) ?? attachmentsSeed;

  const mentioned_users: StreamMessage['mentioned_users'] = message.mentioned_users || [];

  return {
    attachments,
    emojiPickerIsOpen: false,
    fileOrder: Object.keys(fileUploads), // should be removed with version v12
    fileUploads, // should be removed with version v12
    imageOrder: Object.keys(imageUploads), // should be removed with version v12
    imageUploads, // should be removed with version v12
    linkPreviews,
    mentioned_users,
    setText: () => null,
    text: message.text || '',
  };
};

// should be removed with version v12
const determineUploadsWithOrderKeys = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
) => {
  let orderKey: 'fileOrder' | 'imageOrder' = 'fileOrder';
  let uploadsKey: 'fileUploads' | 'imageUploads' = 'fileUploads';
  if (isMessageComposerImageAttachment(attachment)) {
    orderKey = 'imageOrder';
    uploadsKey = 'imageUploads';
  }
  return { orderKey, uploadsKey };
};

// should be removed with version v12
const removeUploadsWithOrder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: MessageInputState<StreamChatGenerics>,
  id: string,
) => {
  const attachment = state.attachments.find((att) => att.id === id);
  if (!attachment) return state;
  const { orderKey, uploadsKey } = determineUploadsWithOrderKeys(attachment);
  const newUploads = { ...state[uploadsKey] };
  delete newUploads[id];
  return {
    ...state,
    [orderKey]: state[orderKey].filter((_id) => _id !== id),
    [uploadsKey]: newUploads,
  };
};

// should be removed with version v12
type FileOrImageUploadsInState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> =
  | Pick<MessageInputState<StreamChatGenerics>, 'fileOrder' | 'fileUploads'>
  | Pick<MessageInputState<StreamChatGenerics>, 'imageOrder' | 'imageUploads'>;

// should be removed with version v12
const updateUploadsWithOrder = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  state: MessageInputState<StreamChatGenerics>,
  attachment: MessageComposerAttachment<StreamChatGenerics>,
): FileOrImageUploadsInState<StreamChatGenerics> => {
  const { orderKey, uploadsKey } = determineUploadsWithOrderKeys(attachment);
  const existingUploadsWithOrder = {
    [orderKey]: state[orderKey],
    [uploadsKey]: state[uploadsKey],
  } as FileOrImageUploadsInState<StreamChatGenerics>;

  const alreadyExists = state[uploadsKey][attachment.id];
  if (isUploadAttachment(attachment) || alreadyExists) {
    const uploadData = isMessageComposerImageAttachment(attachment)
      ? messageComposerAttachmentToImageUpload(attachment)
      : messageComposerAttachmentToFileUpload(attachment);

    return {
      [orderKey]: alreadyExists ? state[orderKey] : state[orderKey].concat(attachment.id),
      [uploadsKey]: {
        ...state[uploadsKey],
        [attachment.id]: { ...alreadyExists, ...uploadData },
      },
    } as FileOrImageUploadsInState<StreamChatGenerics>;
  }
  return existingUploadsWithOrder;
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

    case 'removeAttachment': {
      const { id } = action;
      return {
        ...removeUploadsWithOrder(state, id),
        attachments: state.attachments.filter((att) => att.id !== id),
      };
    }

    case 'upsertAttachment': {
      const { attachment } = action;
      let updated = false;
      const newAttachments = state.attachments.map((att) => {
        if (att.id !== attachment.id) return att;
        updated = true;
        return { ...att, ...attachment };
      });

      return {
        ...state,
        ...updateUploadsWithOrder(state, attachment),
        attachments: updated ? newAttachments : [...newAttachments, attachment],
      };
    }

    case 'setLinkPreviews': {
      const linkPreviews = new Map(state.linkPreviews);
      let attachments = [...state.attachments];
      const actionLinkPreviewIds = Array.from(action.linkPreviews.keys());
      const actionLinkPreviews = Array.from(action.linkPreviews.values());

      if (action.mode === SetLinkPreviewMode.REMOVE) {
        actionLinkPreviewIds.forEach(linkPreviews.delete);
        attachments = attachments.filter(
          (att) => !isLinkPreview(att) || !actionLinkPreviewIds.includes(att.og_scrape_url),
        );
      } else {
        actionLinkPreviews.reduce<LinkPreviewMap>((acc, linkPreview) => {
          const existingPreview = acc.get(linkPreview.og_scrape_url);
          const alreadyEnqueued =
            linkPreview.state === LinkPreviewState.QUEUED &&
            existingPreview?.state !== LinkPreviewState.FAILED;

          if (existingPreview && alreadyEnqueued) return acc;
          acc.set(linkPreview.og_scrape_url, linkPreview);
          return acc;
        }, linkPreviews);

        actionLinkPreviews.forEach((actionLinkPreview) => {
          const existingPreviewIndex = attachments.findIndex(
            (existingAtt) =>
              isLinkPreview(existingAtt) &&
              existingAtt.og_scrape_url === actionLinkPreview.og_scrape_url,
          );
          const existingPreview = attachments[existingPreviewIndex] as LinkPreview | undefined;

          const alreadyEnqueued =
            actionLinkPreview.state === LinkPreviewState.QUEUED &&
            existingPreview?.state !== LinkPreviewState.FAILED;

          if (existingPreview && alreadyEnqueued) return;

          if (action.mode === SetLinkPreviewMode.SET && existingPreview) {
            attachments.splice(existingPreviewIndex, 1, actionLinkPreview);
          } else if (existingPreview) {
            attachments.splice(existingPreviewIndex, 1, {
              ...existingPreview,
              ...actionLinkPreview,
            });
          } else {
            attachments.push(actionLinkPreview);
          }
        }, []);

        if (action.mode === SetLinkPreviewMode.SET) {
          Array.from(state.linkPreviews.keys()).forEach((key) => {
            if (!action.linkPreviews.get(key)) linkPreviews.delete(key);
          });
          attachments = attachments.filter(
            (att) => !isLinkPreview(att) || actionLinkPreviewIds.includes(att.og_scrape_url),
          );
        }
      }

      return {
        ...state,
        attachments,
        linkPreviews,
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
    closeEmojiPickerOnClick,
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

  const textareaRef = useRef<HTMLTextAreaElement>();

  const {
    maxFilesLeft,
    numberOfUploads,
    removeAttachment,
    removeFile,
    removeImage,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachment,
  } = useAttachments<StreamChatGenerics, V>(props, state, dispatch, textareaRef);

  const enrichURLsController = useLinkPreviews({
    dispatch,
    linkPreviews: state.linkPreviews,
    ...urlEnrichmentConfig,
    enrichURLForPreview:
      urlEnrichmentConfig?.enrichURLForPreview ?? enrichURLForPreviewChannelContext,
  });

  const { handleChange, insertText } = useMessageInputText<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
    textareaRef,
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

  const { handleSubmit } = useSubmitHandler<StreamChatGenerics, V>(
    props,
    state,
    dispatch,
    numberOfUploads,
    enrichURLsController,
  );
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
    removeAttachment,
    removeFile,
    removeImage,
    setText,
    showCommandsList,
    showMentionsList,
    textareaRef,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    upsertAttachment,
  };
};
