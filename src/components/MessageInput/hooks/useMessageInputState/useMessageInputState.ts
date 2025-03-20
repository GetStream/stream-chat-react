import type { Reducer } from 'react';
import type React from 'react';
import { useCallback, useReducer, useState } from 'react';

import type { StreamMessage } from '../../../../context/ChannelStateContext';
import { useChannelStateContext } from '../../../../context/ChannelStateContext';

import { useAttachments } from '../useAttachments';
import type { EnrichURLsController } from '../useLinkPreviews';
import { useLinkPreviews } from '../useLinkPreviews';
import { useMessageInputText } from '../useMessageInputText';
import { useSubmitHandler } from '../useSubmitHandler';
import { usePasteHandler } from '../usePasteHandler';
import type { RecordingController } from '../../../MediaRecorder/hooks/useMediaRecorder';
import { useMediaRecorder } from '../../../MediaRecorder/hooks/useMediaRecorder';
import type { LinkPreviewMap, LocalAttachment } from '../../types';
import { LinkPreviewState, SetLinkPreviewMode } from '../../types';
import type { Attachment, Message, SendMessageOptions, UserResponse } from 'stream-chat';

import type { MessageInputProps } from '../../MessageInput';

import { mergeDeep } from '../../../../utils/mergeDeep';
import type { MessageInputState } from './initMessageInputState';
import { initState, makeEmptyMessageInputState } from './initMessageInputState';

type UpsertAttachmentsAction = {
  attachments: LocalAttachment[];
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

type SetComposerStateAction = {
  state: MessageInputState;
  type: 'setComposerState';
};

type ClearAction = {
  type: 'clear';
};

type SetLinkPreviewsAction = {
  linkPreviews: LinkPreviewMap;
  mode: SetLinkPreviewMode;
  type: 'setLinkPreviews';
};

type AddMentionedUserAction = {
  type: 'addMentionedUser';
  user: UserResponse;
};

export type MessageInputReducerAction =
  | SetTextAction
  | ClearAction
  | SetLinkPreviewsAction
  | AddMentionedUserAction
  | UpsertAttachmentsAction
  | RemoveAttachmentsAction
  | SetComposerStateAction;

export type MessageInputHookProps = EnrichURLsController & {
  handleChange: React.ChangeEventHandler<HTMLTextAreaElement>;
  handleSubmit: (
    event?: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message>,
    options?: SendMessageOptions,
  ) => void;
  insertText: (textToInsert: string) => void;
  isUploadEnabled: boolean;
  maxFilesLeft: number;
  numberOfUploads: number;
  onPaste: (event: React.ClipboardEvent<HTMLTextAreaElement>) => void;
  onSelectUser: (item: UserResponse) => void;
  recordingController: RecordingController;
  removeAttachments: (ids: string[]) => void;
  setComposerState: (state: MessageInputState) => void;
  setText: (text: string) => void;
  textareaRef: React.MutableRefObject<HTMLTextAreaElement | null | undefined>;
  uploadAttachment: (attachment: LocalAttachment) => Promise<LocalAttachment | undefined>;
  upsertAttachments: (attachments: (Attachment | LocalAttachment)[]) => void;
};

/**
 * MessageInput state reducer
 */
const messageInputReducer = (
  state: MessageInputState,
  action: MessageInputReducerAction,
) => {
  switch (action.type) {
    case 'setText':
      return { ...state, lastChange: new Date(), text: action.getNewText(state.text) };

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
        lastChange: new Date(),
      };
    }

    case 'removeAttachments': {
      return {
        ...state,
        attachments: state.attachments.filter(
          (att) => !action.ids.includes(att.localMetadata?.id),
        ),
        lastChange: new Date(),
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
        lastChange: new Date(),
        linkPreviews,
      };
    }

    case 'addMentionedUser':
      return {
        ...state,
        lastChange: new Date(),
        mentioned_users: state.mentioned_users.concat(action.user),
      };

    case 'setComposerState':
      return {
        ...action.state,
        lastChange: new Date(),
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
export const useMessageInputState = (
  props: MessageInputProps,
): MessageInputState & MessageInputHookProps & CommandsListState & MentionsListState => {
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
    messageDraft,
    messageDraftsEnabled,
  } = useChannelStateContext('useMessageInputState');

  const defaultValue = getDefaultValue?.() || additionalTextareaProps?.defaultValue;
  const initialStateValue =
    message ||
    (messageDraftsEnabled && messageDraft?.message) ||
    ((Array.isArray(defaultValue)
      ? { text: defaultValue.join('') }
      : { text: defaultValue?.toString() }) as Partial<StreamMessage>);

  const [state, dispatch] = useReducer(
    messageInputReducer as Reducer<MessageInputState, MessageInputReducerAction>,
    initialStateValue as Pick<StreamMessage, 'attachments' | 'mentioned_users' | 'text'>,
    initState,
  );

  const enrichURLsController = useLinkPreviews({
    dispatch,
    linkPreviews: state.linkPreviews,
    ...urlEnrichmentConfig,
    enrichURLForPreview:
      urlEnrichmentConfig?.enrichURLForPreview ?? enrichURLForPreviewChannelContext,
  });

  const { handleChange, insertText, textareaRef } = useMessageInputText(props);

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
    upsertAttachments,
  } = useAttachments(props, state, dispatch, textareaRef);

  const { handleSubmit } = useSubmitHandler(
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
    () => null,
    insertText,
    isUploadEnabled,
    enrichURLsController.findAndEnqueueURLsToEnrich,
  );

  const onSelectUser = useCallback((item: UserResponse) => {
    dispatch({ type: 'addMentionedUser', user: item });
  }, []);

  const setText = useCallback((text: string) => {
    dispatch({ getNewText: () => text, type: 'setText' });
  }, []);

  const setComposerState = useCallback((state: MessageInputState) => {
    dispatch({ state, type: 'setComposerState' });
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
    setComposerState,
    setText,
    showCommandsList,
    showMentionsList,
    textareaRef,
    uploadAttachment,
    upsertAttachments,
  };
};
