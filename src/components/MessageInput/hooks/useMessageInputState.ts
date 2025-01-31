import React, { Reducer, useCallback, useReducer, useState } from 'react';
import { nanoid } from 'nanoid';

import {
  StreamMessage,
  useChannelStateContext,
} from '../../../context/ChannelStateContext';

import { useAttachments } from './useAttachments';
import { EnrichURLsController, useLinkPreviews } from './useLinkPreviews';
import { useMessageInputText } from './useMessageInputText';
import { useSubmitHandler } from './useSubmitHandler';
import { usePasteHandler } from './usePasteHandler';
import {
  RecordingController,
  useMediaRecorder,
} from '../../MediaRecorder/hooks/useMediaRecorder';
import type { LinkPreviewMap, LocalAttachment } from '../types';
import { LinkPreviewState, SetLinkPreviewMode } from '../types';
import type { Attachment, Message, OGAttachment, UserResponse } from 'stream-chat';

import type { MessageInputProps } from '../MessageInput';

import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  SendMessageOptions,
} from '../../../types/types';
import { mergeDeep } from '../../../utils/mergeDeep';

export type MessageInputState<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  attachments: LocalAttachment<StreamChatGenerics>[];
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse<StreamChatGenerics>[];
  setText: (text: string) => void;
  text: string;
};

type UpsertAttachmentsAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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

type SetLinkPreviewsAction = {
  linkPreviews: LinkPreviewMap;
  mode: SetLinkPreviewMode;
  type: 'setLinkPreviews';
};

type AddMentionedUserAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  type: 'addMentionedUser';
  user: UserResponse<StreamChatGenerics>;
};

export type MessageInputReducerAction<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> =
  | SetTextAction
  | ClearAction
  | SetLinkPreviewsAction
  | AddMentionedUserAction<StreamChatGenerics>
  | UpsertAttachmentsAction
  | RemoveAttachmentsAction;

export type MessageInputHookProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
  uploadAttachment: (
    attachment: LocalAttachment<StreamChatGenerics>,
  ) => Promise<LocalAttachment<StreamChatGenerics> | undefined>;
  uploadNewFiles: (files: FileList | File[]) => void;
  upsertAttachments: (
    attachments: (Attachment<StreamChatGenerics> | LocalAttachment<StreamChatGenerics>)[],
  ) => void;
};

const makeEmptyMessageInputState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(): MessageInputState<StreamChatGenerics> => ({
  attachments: [],
  linkPreviews: new Map(),
  mentioned_users: [],
  setText: () => null,
  text: '',
});

/**
 * Initializes the state. Empty if the message prop is falsy.
 */
const initState = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  message?: Pick<
    StreamMessage<StreamChatGenerics>,
    'attachments' | 'mentioned_users' | 'text'
  >,
): MessageInputState<StreamChatGenerics> => {
  if (!message) {
    return makeEmptyMessageInputState();
  }

  const linkPreviews =
    message.attachments?.reduce<LinkPreviewMap>((acc, attachment) => {
      if (!attachment.og_scrape_url) return acc;
      acc.set(attachment.og_scrape_url, {
        ...(attachment as OGAttachment),
        state: LinkPreviewState.LOADED,
      });
      return acc;
    }, new Map()) ?? new Map();

  const attachments =
    message.attachments
      ?.filter(({ og_scrape_url }) => !og_scrape_url)
      .map(
        (att) =>
          ({
            ...att,
            localMetadata: { id: nanoid() },
          }) as LocalAttachment<StreamChatGenerics>,
      ) || [];

  const mentioned_users: StreamMessage['mentioned_users'] = message.mentioned_users || [];

  return {
    attachments,
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
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
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
            att.localMetadata?.id &&
            att.localMetadata?.id === actionAttachment.localMetadata?.id,
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
        attachments: state.attachments.filter(
          (att) => !action.ids.includes(att.localMetadata?.id),
        ),
      };
    }

    case 'setLinkPreviews': {
      const linkPreviews = new Map(state.linkPreviews);

      if (action.mode === SetLinkPreviewMode.REMOVE) {
        Array.from(action.linkPreviews.keys()).forEach((key) => {
          linkPreviews.delete(key);
        });
      } else {
        Array.from(action.linkPreviews.values()).reduce<LinkPreviewMap>(
          (acc, linkPreview) => {
            const existingPreview = acc.get(linkPreview.og_scrape_url);
            const alreadyEnqueued =
              linkPreview.state === LinkPreviewState.QUEUED &&
              existingPreview?.state !== LinkPreviewState.FAILED;

            if (existingPreview && alreadyEnqueued) return acc;
            acc.set(linkPreview.og_scrape_url, linkPreview);
            return acc;
          },
          linkPreviews,
        );

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
  V extends CustomTrigger = CustomTrigger,
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
    enrichURLForPreview: enrichURLForPreviewChannelContext,
  } = useChannelStateContext<StreamChatGenerics>('useMessageInputState');

  const defaultValue = getDefaultValue?.() || additionalTextareaProps?.defaultValue;
  const initialStateValue =
    message ||
    ((Array.isArray(defaultValue)
      ? { text: defaultValue.join('') }
      : { text: defaultValue?.toString() }) as Partial<
      StreamMessage<StreamChatGenerics>
    >);

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

  const { handleChange, insertText, textareaRef } = useMessageInputText<
    StreamChatGenerics,
    V
  >(props, state, dispatch, enrichURLsController.findAndEnqueueURLsToEnrich);

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
    uploadAttachment,
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

  const isUploadEnabled = !!channelCapabilities['upload-file'];

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
    setText,
    showCommandsList,
    showMentionsList,
    textareaRef,
    uploadAttachment,
    uploadNewFiles,
    upsertAttachments,
  };
};
