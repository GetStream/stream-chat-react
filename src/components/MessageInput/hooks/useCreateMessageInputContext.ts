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
    attachments,
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
    fileOrder,
    fileUploads,
    findAndEnqueueURLsToEnrich,
    focus,
    grow,
    handleChange,
    handleSubmit,
    hideSendButton,
    imageOrder,
    imageUploads,
    insertText,
    isUploadEnabled,
    linkPreviews,
    maxFilesLeft,
    maxRows,
    mentionAllAppUsers,
    mentioned_users,
    mentionQueryParams,
    message,
    noFiles,
    numberOfUploads,
    onPaste,
    onSelectUser,
    openCommandsList,
    openMentionsList,
    overrideSubmitHandler,
    parent,
    publishTypingEvent,
    removeFile,
    removeImage,
    setCooldownRemaining,
    setText,
    shouldSubmit,
    showCommandsList,
    showMentionsList,
    text,
    textareaRef,
    uploadFile,
    uploadImage,
    uploadNewFiles,
    useMentionsTransliteration,
  } = value;

  const editing = message?.editing;
  const fileUploadsValue = Object.entries(fileUploads)
    // eslint-disable-next-line
    .map(([_, value]) => value.state)
    .join();
  const imageUploadsValue = Object.entries(imageUploads)
    // eslint-disable-next-line
    .map(([_, value]) => value.state)
    .join();
  const linkPreviewsValue = Array.from(linkPreviews.values()).join();
  const mentionedUsersLength = mentioned_users.length;
  const parentId = parent?.id;

  const messageInputContext: MessageInputContextValue<StreamChatGenerics, V> = useMemo(
    () => ({
      additionalTextareaProps,
      attachments,
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
      fileOrder,
      fileUploads,
      findAndEnqueueURLsToEnrich,
      focus,
      grow,
      handleChange,
      handleSubmit,
      hideSendButton,
      imageOrder,
      imageUploads,
      insertText,
      isUploadEnabled,
      linkPreviews,
      maxFilesLeft,
      maxRows,
      mentionAllAppUsers,
      mentioned_users,
      mentionQueryParams,
      message,
      noFiles,
      numberOfUploads,
      onPaste,
      onSelectUser,
      openCommandsList,
      openMentionsList,
      overrideSubmitHandler,
      parent,
      publishTypingEvent,
      removeFile,
      removeImage,
      setCooldownRemaining,
      setText,
      shouldSubmit,
      showCommandsList,
      showMentionsList,
      text,
      textareaRef,
      uploadFile,
      uploadImage,
      uploadNewFiles,
      useMentionsTransliteration,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      cancelURLEnrichment,
      cooldownInterval,
      cooldownRemaining,
      dismissLinkPreview,
      editing,
      emojiSearchIndex,
      fileUploadsValue,
      findAndEnqueueURLsToEnrich,
      hideSendButton,
      imageUploadsValue,
      isUploadEnabled,
      linkPreviewsValue,
      mentionedUsersLength,
      parentId,
      publishTypingEvent,
      showCommandsList,
      showMentionsList,
      text,
      handleSubmit,
    ],
  );

  return messageInputContext;
};
