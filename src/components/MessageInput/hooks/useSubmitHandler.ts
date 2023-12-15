import { useEffect, useRef } from 'react';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context/TranslationContext';

import type { Attachment, Message, UpdatedMessage } from 'stream-chat';

import type { MessageInputReducerAction, MessageInputState } from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';
import {
  isLinkPreview,
  isMessageComposerFileAttachment,
  isMessageComposerImageAttachment,
  isUploadAttachment,
} from './useAttachments';

import type { CustomTrigger, DefaultStreamChatGenerics } from '../../../types/types';
import type { EnrichURLsController } from './useLinkPreviews';
import { LinkPreview, LinkPreviewState, MessageComposerAttachment, UploadState } from '../types';

const isEmptyMessage = (text: string) => {
  const trimmedMessage = text.trim();
  return (
    trimmedMessage === '' ||
    trimmedMessage === '>' ||
    trimmedMessage === '``````' ||
    trimmedMessage === '``' ||
    trimmedMessage === '**' ||
    trimmedMessage === '____' ||
    trimmedMessage === '__' ||
    trimmedMessage === '****'
  );
};

const attachmentFilter = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  attachment: MessageComposerAttachment<StreamChatGenerics>,
  index: number,
  self: MessageComposerAttachment<StreamChatGenerics>[],
) => {
  if (isLinkPreview(attachment)) {
    return attachment.state === LinkPreviewState.LOADED;
  }

  if (!isUploadAttachment(attachment)) return true;
  if (attachment.uploadState === UploadState.failed) return false;

  let isNotDuplicateUploadAttachment: (
    att: MessageComposerAttachment<StreamChatGenerics>,
  ) => boolean;
  if (isMessageComposerImageAttachment(attachment)) {
    isNotDuplicateUploadAttachment = (att: MessageComposerAttachment<StreamChatGenerics>) =>
      !isMessageComposerImageAttachment(att) ||
      att.image_url !== attachment.image_url ||
      att.id !== attachment.id;
  } else if (isMessageComposerFileAttachment(attachment)) {
    isNotDuplicateUploadAttachment = (att: MessageComposerAttachment<StreamChatGenerics>) =>
      !isMessageComposerFileAttachment(att) ||
      att.asset_url !== attachment.asset_url ||
      att.id !== attachment.id;
  } else {
    return attachment;
  }
  return [...self.slice(0, index), ...self.slice(index + 1)].every(isNotDuplicateUploadAttachment);
};

type CleanedAttachmentsWithLinkPreviews<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = { cleanedAttachments: Attachment<StreamChatGenerics>[]; linkPreviews: LinkPreview[] };

const messageComposerAttachmentToMessageAttachmentReducer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  acc: CleanedAttachmentsWithLinkPreviews<StreamChatGenerics>,
  attachment: MessageComposerAttachment<StreamChatGenerics>,
) => {
  const finalAtt: Attachment<StreamChatGenerics> = { ...attachment };
  if (isUploadAttachment(attachment)) {
    delete finalAtt.file;
    delete finalAtt.uploadState;
  }
  if (isMessageComposerImageAttachment(attachment)) {
    delete finalAtt.previewUri;
  }
  if (isLinkPreview(attachment)) {
    delete finalAtt.state;
    acc.linkPreviews.push(attachment);
  }
  delete finalAtt.id;
  acc.cleanedAttachments.push(finalAtt);
  return acc;
};

export const useSubmitHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  numberOfUploads: number,
  enrichURLsController: EnrichURLsController,
) => {
  const { clearEditingState, message, overrideSubmitHandler, parent, publishTypingEvent } = props;

  const { attachments, mentioned_users, text } = state;

  const { cancelURLEnrichment, findAndEnqueueURLsToEnrich } = enrichURLsController;
  const { channel } = useChannelStateContext<StreamChatGenerics>('useSubmitHandler');
  const { addNotification, editMessage, sendMessage } = useChannelActionContext<StreamChatGenerics>(
    'useSubmitHandler',
  );
  const { t } = useTranslationContext('useSubmitHandler');

  const textReference = useRef({ hasChanged: false, initialText: text });

  useEffect(() => {
    if (!textReference.current.initialText.length) {
      textReference.current.initialText = text;
      return;
    }

    textReference.current.hasChanged = text !== textReference.current.initialText;
  }, [text]);

  const handleSubmit = async (
    event: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
  ) => {
    event.preventDefault();

    if (isEmptyMessage(text) && numberOfUploads === 0) return;

    const linkPreviewsEnabled = !!findAndEnqueueURLsToEnrich;

    // the channel component handles the actual sending of the message
    const someAttachmentsUploading = attachments.some(
      (att) => isUploadAttachment(att) && att.uploadState === UploadState.uploading,
    );

    if (someAttachmentsUploading) {
      return addNotification(t('Wait until all attachments have uploaded'), 'error');
    }

    const { cleanedAttachments, linkPreviews } = attachments
      .filter(attachmentFilter)
      .reduce<CleanedAttachmentsWithLinkPreviews<StreamChatGenerics>>(
        messageComposerAttachmentToMessageAttachmentReducer,
        {
          cleanedAttachments: [],
          linkPreviews: [],
        },
      );

    let someLinkPreviewsLoading;
    let someLinkPreviewsDismissed;
    if (linkPreviewsEnabled) {
      // prevent showing link preview in MessageInput after the message has been sent
      cancelURLEnrichment();

      someLinkPreviewsLoading = linkPreviews.some((linkPreview) =>
        [LinkPreviewState.QUEUED, LinkPreviewState.LOADING].includes(linkPreview.state),
      );
      someLinkPreviewsDismissed = linkPreviews.some(
        (linkPreview) => linkPreview.state === LinkPreviewState.DISMISSED,
      );
    }

    // Instead of checking if a user is still mentioned every time the text changes,
    // just filter out non-mentioned users before submit, which is cheaper
    // and allows users to easily undo any accidental deletion
    const actualMentionedUsers = Array.from(
      new Set(
        mentioned_users.filter(
          ({ id, name }) => text.includes(`@${id}`) || text.includes(`@${name}`),
        ),
      ),
    );

    const updatedMessage = {
      attachments: cleanedAttachments,
      mentioned_users: actualMentionedUsers,
      text,
    };

    const sendOptions = linkPreviewsEnabled
      ? {
          // scraped attachments are added only if all enrich queries have completed. Otherwise, the scraping has to be done server-side.
          skip_enrich_url:
            (!someLinkPreviewsLoading && linkPreviews.length > 0) || someLinkPreviewsDismissed,
        }
      : undefined;

    if (message) {
      delete message.i18n;

      try {
        await editMessage(
          ({
            ...message,
            ...updatedMessage,
            ...customMessageData,
          } as unknown) as UpdatedMessage<StreamChatGenerics>,
          sendOptions,
        );

        clearEditingState?.();
        dispatch({ type: 'clear' });
      } catch (err) {
        addNotification(t('Edit message request failed'), 'error');
      }
    } else {
      try {
        dispatch({ type: 'clear' });

        if (overrideSubmitHandler) {
          await overrideSubmitHandler(
            {
              ...updatedMessage,
              parent,
            },
            channel.cid,
            customMessageData,
            sendOptions,
          );
        } else {
          await sendMessage(
            {
              ...updatedMessage,
              parent,
            },
            customMessageData,
            sendOptions,
          );
        }

        if (publishTypingEvent) await channel.stopTyping();
      } catch (err) {
        dispatch({
          getNewText: () => text,
          type: 'setText',
        });

        actualMentionedUsers?.forEach((user) => {
          dispatch({ type: 'addMentionedUser', user });
        });

        addNotification(t('Send message request failed'), 'error');
      }
    }
  };

  return { handleSubmit };
};
