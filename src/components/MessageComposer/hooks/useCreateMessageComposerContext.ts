import { useMemo } from 'react';

import type { MessageComposerContextValue } from '../../../context/MessageComposerContext';

export const useCreateMessageComposerContext = (value: MessageComposerContextValue) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingEnabled,
    emojiSearchIndex,
    focus,
    handleSubmit,
    hideSendButton,
    maxRows,
    minRows,
    onPaste,
    parent,
    recordingController,
    shouldSubmit,
    textareaRef,
  } = value;

  const parentId = parent?.id;

  const messageComposerContext: MessageComposerContextValue = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      emojiSearchIndex,
      focus,
      handleSubmit,
      hideSendButton,
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
      minRows,
      parentId,
      recordingController,
    ],
  );

  return messageComposerContext;
};
