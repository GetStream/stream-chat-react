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
    closeEmojiPicker,
    closeMentionsList,
    cooldownInterval,
    cooldownRemaining,
    disabled,
    disableMentions,
    dismissLinkPreview,
    doFileUploadRequest,
    doImageUploadRequest,
    emojiIndex,
    emojiPickerIsOpen,
    emojiPickerRef,
    errorHandler,
    fileOrder,
    fileUploads,
    findAndEnqueueURLsToEnrich,
    focus,
    grow,
    handleChange,
    handleEmojiKeyDown,
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
    onSelectEmoji,
    onSelectUser,
    openCommandsList,
    openEmojiPicker,
    openMentionsList,
    overrideSubmitHandler,
    parent,
    publishTypingEvent,
    removeAttachment,
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
    upsertAttachment,
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
      closeEmojiPicker,
      closeMentionsList,
      cooldownInterval,
      cooldownRemaining,
      disabled,
      disableMentions,
      dismissLinkPreview,
      doFileUploadRequest,
      doImageUploadRequest,
      emojiIndex,
      emojiPickerIsOpen,
      emojiPickerRef,
      errorHandler,
      fileOrder,
      fileUploads,
      findAndEnqueueURLsToEnrich,
      focus,
      grow,
      handleChange,
      handleEmojiKeyDown,
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
      onSelectEmoji,
      onSelectUser,
      openCommandsList,
      openEmojiPicker,
      openMentionsList,
      overrideSubmitHandler,
      parent,
      publishTypingEvent,
      removeAttachment,
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
      upsertAttachment,
      useMentionsTransliteration,
    }),
    [
      cancelURLEnrichment,
      cooldownInterval,
      cooldownRemaining,
      dismissLinkPreview,
      editing,
      emojiPickerIsOpen,
      fileUploadsValue,
      findAndEnqueueURLsToEnrich,
      hideSendButton,
      imageUploadsValue,
      isUploadEnabled,
      linkPreviewsValue,
      mentionedUsersLength,
      parentId,
      publishTypingEvent,
      removeAttachment,
      showCommandsList,
      showMentionsList,
      text,
      handleSubmit,
      upsertAttachment,
    ],
  );

  return messageInputContext;
};
