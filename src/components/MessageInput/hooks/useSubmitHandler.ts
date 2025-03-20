import { useEffect, useRef } from 'react';
import { useChannelActionContext } from '../../../context/ChannelActionContext';
import { useChannelStateContext } from '../../../context/ChannelStateContext';
import { useTranslationContext } from '../../../context/TranslationContext';
import { type LinkPreviewMap, LinkPreviewState, type LocalAttachment } from '../types';

import type {
  Attachment,
  Message,
  SendMessageOptions,
  UpdatedMessage,
  UserResponse,
} from 'stream-chat';

import type {
  MessageInputReducerAction,
  MessageInputState,
} from './useMessageInputState';
import type { MessageInputProps } from '../MessageInput';

import type { EnrichURLsController } from './useLinkPreviews';

export type PrepareMessageParams = Pick<
  EnrichURLsController,
  'cancelURLEnrichment' | 'findAndEnqueueURLsToEnrich'
> & {
  attachments: LocalAttachment[];
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse[];
  numberOfUploads: number;
  text: string;
  customMessageData?: Partial<Message>;
  options?: SendMessageOptions;
};

export const prepareMessage = ({
  attachments,
  cancelURLEnrichment,
  customMessageData,
  findAndEnqueueURLsToEnrich,
  linkPreviews,
  mentioned_users,
  numberOfUploads,
  options,
  text,
}: PrepareMessageParams) => {
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
    return {};
  const someAttachmentsUploading = attachments.some(
    (att) => att.localMetadata?.uploadState === 'uploading',
  );

  if (someAttachmentsUploading) {
    return {
      notification: { text: 'Wait until all attachments have uploaded', type: 'error' },
    };
  }

  const attachmentsFromUploads = attachments
    .filter(
      (att) =>
        att.localMetadata?.uploadState !== 'failed' ||
        (findAndEnqueueURLsToEnrich && !att.og_scrape_url), // filter out all the attachments scraped before the message was edited
    )
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
          .filter(
            (linkPreview) =>
              linkPreview.state === LinkPreviewState.LOADED &&
              !attachmentsFromUploads.find(
                (attFromUpload) =>
                  attFromUpload.og_scrape_url === linkPreview.og_scrape_url,
              ),
          )

          .map(
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            ({ state: linkPreviewState, ...ogAttachment }) => ogAttachment as Attachment,
          );

    // scraped attachments are added only if all enrich queries has completed. Otherwise, the scraping has to be done server-side.
    sendOptions.skip_enrich_url =
      (!someLinkPreviewsLoading && attachmentsFromLinkPreviews.length > 0) ||
      someLinkPreviewsDismissed;
  }

  const newAttachments = [...attachmentsFromUploads, ...attachmentsFromLinkPreviews];

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

  return {
    message: {
      attachments: newAttachments,
      mentioned_users: actualMentionedUsers,
      text,
    },
    sendOptions,
  };
};

export const useSubmitHandler = (
  props: MessageInputProps,
  state: MessageInputState,
  dispatch: React.Dispatch<MessageInputReducerAction>,
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
  const { channel } = useChannelStateContext('useSubmitHandler');
  const { addNotification, editMessage, sendMessage } =
    useChannelActionContext('useSubmitHandler');
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
    customMessageData?: Partial<Message>,
    options?: SendMessageOptions,
  ) => {
    event?.preventDefault();
    const {
      message: updatedMessage,
      notification,
      sendOptions,
    } = prepareMessage({
      attachments,
      cancelURLEnrichment,
      customMessageData,
      findAndEnqueueURLsToEnrich,
      linkPreviews,
      mentioned_users,
      numberOfUploads,
      options,
      text,
    });

    if (notification?.type === 'error') {
      addNotification(t(notification.text), 'error');
      return;
    }

    if (!updatedMessage) return;

    if (message && message.type !== 'error') {
      delete message.i18n;

      try {
        await editMessage(
          {
            ...message,
            ...updatedMessage,
            ...customMessageData,
          } as unknown as UpdatedMessage,
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

        updatedMessage.mentioned_users?.forEach((user) => {
          dispatch({ type: 'addMentionedUser', user });
        });

        addNotification(t('Send message request failed'), 'error');
      }
    }
  };

  return { handleSubmit };
};
