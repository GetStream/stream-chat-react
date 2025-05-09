import { useEffect, useRef } from 'react';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { LinkPreviewState } from '../types';

import type { Attachment, Message, UpdatedMessage } from 'stream-chat';

import type {
  MessageInputReducerAction,
  MessageInputState,
} from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';

import type {
  CustomTrigger,
  DefaultStreamChatGenerics,
  SendMessageOptions,
} from '../../../types/types';
import type { EnrichURLsController } from './useLinkPreviews';

export const useSubmitHandler = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
  V extends CustomTrigger = CustomTrigger,
>(
  props: MessageInputProps<StreamChatGenerics, V>,
  state: MessageInputState<StreamChatGenerics>,
  dispatch: React.Dispatch<MessageInputReducerAction<StreamChatGenerics>>,
  numberOfUploads: number,
  enrichURLsController: EnrichURLsController,
) => {
  const {
    clearEditingState,
    message,
    overrideSubmitHandler,
    parent,
    publishTypingEvent,
  } = props;

  const { attachments, linkPreviews, mentioned_users, text } = state;

  const { cancelURLEnrichment, findAndEnqueueURLsToEnrich } = enrichURLsController;
  const { channel } = useChannelStateContext<StreamChatGenerics>('useSubmitHandler');
  const { addNotification, editMessage, sendMessage } =
    useChannelActionContext<StreamChatGenerics>('useSubmitHandler');
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
    event?: React.BaseSyntheticEvent,
    customMessageData?: Partial<Message<StreamChatGenerics>>,
    options?: SendMessageOptions,
  ) => {
    event?.preventDefault();
    const trimmedMessage = text.trim();
    const isEmptyMessage =
      trimmedMessage === '' ||
      trimmedMessage === '>' ||
      trimmedMessage === '``````' ||
      trimmedMessage === '``' ||
      trimmedMessage === '**' ||
      trimmedMessage === '____' ||
      trimmedMessage === '__' ||
      trimmedMessage === '****';

    if (
      isEmptyMessage &&
      numberOfUploads === 0 &&
      attachments.length === 0 &&
      !customMessageData?.poll_id
    )
      return;
    const someAttachmentsUploading = attachments.some(
      (att) => att.localMetadata?.uploadState === 'uploading',
    );

    if (someAttachmentsUploading) {
      return addNotification(t('Wait until all attachments have uploaded'), 'error');
    }

    const attachmentsWithoutLinkPreviews = attachments
      .filter((att) => {
        const isSuccessfulUpload = att.localMetadata?.uploadState === 'finished';
        const isNotUpload = !att.localMetadata?.uploadState;
        const isNotLinkPreview = !att.og_scrape_url;
        return isNotLinkPreview && (isSuccessfulUpload || isNotUpload);
      })
      .map((localAttachment) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { localMetadata: _, ...attachment } = localAttachment;
        return attachment as Attachment;
      });

    const sendOptions = { ...options };
    let attachmentsFromLinkPreviews: Attachment[] = [];
    if (findAndEnqueueURLsToEnrich) {
      // prevent showing link preview in MessageInput after the message has been sent
      cancelURLEnrichment();
      const someLinkPreviewsLoading = Array.from(linkPreviews.values()).some(
        (linkPreview) =>
          [LinkPreviewState.QUEUED, LinkPreviewState.LOADING].includes(linkPreview.state),
      );
      const someLinkPreviewsDismissed = Array.from(linkPreviews.values()).some(
        (linkPreview) => linkPreview.state === LinkPreviewState.DISMISSED,
      );

      attachmentsFromLinkPreviews = someLinkPreviewsLoading
        ? []
        : Array.from(linkPreviews.values())
            .filter((linkPreview) => linkPreview.state === LinkPreviewState.LOADED)

            .map(
              // eslint-disable-next-line @typescript-eslint/no-unused-vars
              ({ state: linkPreviewState, ...ogAttachment }) =>
                ogAttachment as Attachment,
            );

      // scraped attachments are added only if all enrich queries has completed. Otherwise, the scraping has to be done server-side.
      sendOptions.skip_enrich_url =
        (!someLinkPreviewsLoading && attachmentsFromLinkPreviews.length > 0) ||
        someLinkPreviewsDismissed;
    }

    const newAttachments = [
      ...attachmentsWithoutLinkPreviews,
      ...attachmentsFromLinkPreviews,
    ];

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
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers,
      text,
    };

    if (message && message.type !== 'error') {
      delete message.i18n;

      try {
        await editMessage(
          {
            ...message,
            ...updatedMessage,
            ...customMessageData,
          } as unknown as UpdatedMessage<StreamChatGenerics>,
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
