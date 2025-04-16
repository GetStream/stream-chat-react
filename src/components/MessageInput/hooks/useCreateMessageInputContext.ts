import { useMemo } from 'react';

import type { MessageInputContextValue } from '../../../context/MessageInputContext';

export const useCreateMessageInputContext = (value: MessageInputContextValue) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingEnabled,
    clearEditingState,
    cooldownInterval,
    cooldownRemaining,
    disabled,
    disableMentions,
    doFileUploadRequest,
    doImageUploadRequest,
    emojiSearchIndex,
    focus,
    grow,
    handleSubmit,
    hideSendButton,
    insertText,
    isThreadInput,
    maxRows,
    mentionAllAppUsers,
    mentionQueryParams,
    minRows,
    onPaste,
    parent,
    publishTypingEvent,
    recordingController,
    setCooldownRemaining,
    shouldSubmit,
    textareaRef,
    useMentionsTransliteration,
  } = value;

  const parentId = parent?.id;

  const messageInputContext: MessageInputContextValue = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      clearEditingState,
      cooldownInterval,
      cooldownRemaining,
      disabled,
      disableMentions,
      doFileUploadRequest,
      doImageUploadRequest,
      emojiSearchIndex,
      focus,
      grow,
      handleSubmit,
      hideSendButton,
      insertText,
      isThreadInput,
      maxRows,
      mentionAllAppUsers,
      mentionQueryParams,
      minRows,
      onPaste,
      parent,
      publishTypingEvent,
      recordingController,
      setCooldownRemaining,
      shouldSubmit,
      textareaRef,
      useMentionsTransliteration,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      cooldownInterval,
      cooldownRemaining,
      emojiSearchIndex,
      handleSubmit,
      hideSendButton,
      isThreadInput,
      minRows,
      parentId,
      publishTypingEvent,
      recordingController,
    ],
  );

  return messageInputContext;
};
