import { useMemo } from 'react';

import type { MessageInputContextValue } from '../../../context/MessageInputContext';
import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';

export const useCreateMessageInputContext = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  value: MessageInputContextValue<StreamChatGenerics, V>,
) => {
  const {
    additionalTextareaProps,
    asyncMessagesMultiSendEnabled,
    attachments,
    audioRecordingEnabled,
    autocompleteTriggers,
    cancelURLEnrichment,
    clearEditingState,
    closeCommandsList,
    closeMentionsList,
    cooldownInterval,
    cooldownRemaining,
    disabled,
    disableMentions,
    dismissLinkPreview,
    doFileUploadRequest,
    doImageUploadRequest,
    emojiSearchIndex,
    errorHandler,
    findAndEnqueueURLsToEnrich,
    focus,
    grow,
    handleChange,
    handleSubmit,
    hideSendButton,
    insertText,
    isUploadEnabled,
    linkPreviews,
    maxFilesLeft,
    maxRows,
    mentionAllAppUsers,
    mentioned_users,
    mentionQueryParams,
    message,
    minRows,
    noFiles,
    numberOfUploads,
    onPaste,
    onSelectUser,
    openCommandsList,
    openMentionsList,
    overrideSubmitHandler,
    parent,
    publishTypingEvent,
    recordingController,
    removeAttachments,
    setCooldownRemaining,
    setText,
    shouldSubmit,
    showCommandsList,
    showMentionsList,
    text,
    textareaRef,
    uploadAttachment,
    uploadNewFiles,
    upsertAttachments,
    useMentionsTransliteration,
  } = value;

  const editing = message?.editing;
  const linkPreviewsValue = Array.from(linkPreviews.values()).join();
  const mentionedUsersLength = mentioned_users.length;
  const parentId = parent?.id;

  const messageInputContext: MessageInputContextValue<StreamChatGenerics, V> = useMemo(
    () => ({
      additionalTextareaProps,
      asyncMessagesMultiSendEnabled,
      attachments,
      audioRecordingEnabled,
      autocompleteTriggers,
      cancelURLEnrichment,
      clearEditingState,
      closeCommandsList,
      closeMentionsList,
      cooldownInterval,
      cooldownRemaining,
      disabled,
      disableMentions,
      dismissLinkPreview,
      doFileUploadRequest,
      doImageUploadRequest,
      emojiSearchIndex,
      errorHandler,
      findAndEnqueueURLsToEnrich,
      focus,
      grow,
      handleChange,
      handleSubmit,
      hideSendButton,
      insertText,
      isUploadEnabled,
      linkPreviews,
      maxFilesLeft,
      maxRows,
      mentionAllAppUsers,
      mentioned_users,
      mentionQueryParams,
      message,
      minRows,
      noFiles,
      numberOfUploads,
      onPaste,
      onSelectUser,
      openCommandsList,
      openMentionsList,
      overrideSubmitHandler,
      parent,
      publishTypingEvent,
      recordingController,
      removeAttachments,
      setCooldownRemaining,
      setText,
      shouldSubmit,
      showCommandsList,
      showMentionsList,
      text,
      textareaRef,
      uploadAttachment,
      uploadNewFiles,
      upsertAttachments,
      useMentionsTransliteration,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      asyncMessagesMultiSendEnabled,
      attachments,
      audioRecordingEnabled,
      cancelURLEnrichment,
      cooldownInterval,
      cooldownRemaining,
      dismissLinkPreview,
      editing,
      emojiSearchIndex,
      findAndEnqueueURLsToEnrich,
      handleSubmit,
      hideSendButton,
      isUploadEnabled,
      linkPreviewsValue,
      mentionedUsersLength,
      minRows,
      parentId,
      publishTypingEvent,
      recordingController,
      removeAttachments,
      showCommandsList,
      showMentionsList,
      text,
      uploadAttachment,
      upsertAttachments,
    ],
  );

  return messageInputContext;
};
