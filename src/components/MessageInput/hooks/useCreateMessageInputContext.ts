import { useMemo } from 'react';

import type { MessageInputContextValue } from '../../../context/MessageInputContext';

export const useCreateMessageInputContext = (value: MessageInputContextValue) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingEnabled,
    clearEditingState,
    emojiSearchIndex,
    focus,
    handleSubmit,
    hideSendButton,
    isThreadInput,
    maxRows,
    minRows,
    onPaste,
    parent,
    recordingController,
    shouldSubmit,
    textareaRef,
  } = value;

  const parentId = parent?.id;

  const messageInputContext: MessageInputContextValue = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      clearEditingState,
      emojiSearchIndex,
      focus,
      handleSubmit,
      hideSendButton,
      isThreadInput,
      maxRows,
      minRows,
      onPaste,
      parent,
      recordingController,
      shouldSubmit,
      textareaRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      emojiSearchIndex,
      handleSubmit,
      hideSendButton,
      isThreadInput,
      minRows,
      parentId,
      recordingController,
    ],
  );

  return messageInputContext;
};
