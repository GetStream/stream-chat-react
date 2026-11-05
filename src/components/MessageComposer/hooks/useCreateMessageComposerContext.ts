import { useMemo } from 'react';

import type { MessageComposerContextValue } from '../../../context/MessageComposerContext';

export const useCreateMessageComposerContext = (value: MessageComposerContextValue) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    audioRecordingEnabled,
    focus,
    hideSendButton,
    maxRows,
    minRows,
    onPaste,
    recordingController,
    shouldSubmit,
    textareaRef,
  } = value;

  const messageComposerContext: MessageComposerContextValue = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      focus,
      hideSendButton,
      maxRows,
      minRows,
      onPaste,
      recordingController,
      shouldSubmit,
      textareaRef,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncMessagesMultiSendEnabled,
      audioRecordingEnabled,
      hideSendButton,
      minRows,
      recordingController,
    ],
  );

  return messageComposerContext;
};
