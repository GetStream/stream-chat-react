import { useMemo } from 'react';

import type { MessageInputContextValue } from '../../../context/MessageInputContext';

export const useCreateMessageInputContext = (value: MessageInputContextValue) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingEnabled,
    cooldownInterval,
    cooldownRemaining,
    emojiSearchIndex,
    focus,
    hideSendButton,
    isThreadInput,
    maxRows,
    minRows,
    onPaste,
    parent,
    recordingController,
    setCooldownRemaining,
    shouldSubmit,
    textareaRef,
  } = value;

  const parentId = parent?.id;

  const messageInputContext: MessageInputContextValue = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      cooldownInterval,
      cooldownRemaining,
      emojiSearchIndex,
      focus,
      hideSendButton,
      isThreadInput,
      maxRows,
      minRows,
      onPaste,
      parent,
      recordingController,
      setCooldownRemaining,
      shouldSubmit,
      textareaRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      cooldownInterval,
      cooldownRemaining,
      emojiSearchIndex,
      hideSendButton,
      isThreadInput,
      minRows,
      parentId,
      recordingController,
    ],
  );

  return messageInputContext;
};
