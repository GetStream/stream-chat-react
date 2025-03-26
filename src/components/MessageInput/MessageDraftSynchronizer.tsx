import { useEffect, useRef } from 'react';
import { generateMessageId } from '../Channel/utils';
import type { EnrichURLsController } from './hooks/useLinkPreviews';
import { initState } from './hooks/useMessageInputState/initMessageInputState';
import {
  useChannelStateContext,
  useChatContext,
  useMessageInputContext,
} from '../../context';
import type {
  Attachment,
  DraftMessagePayload,
  DraftResponse,
  Event,
  LocalMessage,
  LocalMessageBase,
  Message,
  MessageComposerState,
  SendMessageOptions,
  UserResponse,
} from 'stream-chat';
import type { LinkPreviewMap, LocalAttachment } from './types';
import { LinkPreviewState } from './types';
import type { PropsWithChildrenOnly } from '../../types/types';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { useStateStore } from '../../store';

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

type MessageDraftRefs = Pick<
  EnrichURLsController,
  'cancelURLEnrichment' | 'findAndEnqueueURLsToEnrich'
> & {
  attachments: LocalAttachment[];
  lastChange: Date | undefined;
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse[];
  numberOfUploads: number;
  text: string;
  editedMessage?: LocalMessage;
  messageDraft: DraftResponse | null;
  parent?: LocalMessage;
  quotedMessage: LocalMessageBase | null;
};

const messageComposerStateSelector = (
  state: MessageComposerState,
): Pick<MessageComposerState, 'quotedMessage'> => ({
  quotedMessage: state.quotedMessage,
});

// FIXME: Move all the logic from this component to the LLC Channel reactive state
export const MessageDraftSynchronizer = ({ children }: PropsWithChildrenOnly) => {
  const { client } = useChatContext();
  const { channel, messageDraft, messageDraftsEnabled } = useChannelStateContext();
  const messageComposer = useMessageComposer();
  const { quotedMessage } = useStateStore(
    messageComposer.state,
    messageComposerStateSelector,
  );

  const {
    attachments,
    cancelURLEnrichment,
    findAndEnqueueURLsToEnrich,
    lastChange,
    linkPreviews,
    mentioned_users,
    message: editedMessage,
    numberOfUploads,
    parent,
    setComposerState,
    text,
  } = useMessageInputContext();

  const draftPrereqRefs = useRef<MessageDraftRefs>({
    attachments,
    cancelURLEnrichment,
    editedMessage,
    findAndEnqueueURLsToEnrich,
    lastChange,
    linkPreviews,
    mentioned_users,
    messageDraft,
    numberOfUploads,
    parent,
    quotedMessage,
    text,
  });

  useEffect(() => {
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    draftPrereqRefs.current = {
      attachments,
      cancelURLEnrichment,
      editedMessage,
      findAndEnqueueURLsToEnrich,
      lastChange,
      linkPreviews,
      mentioned_users,
      messageDraft,
      numberOfUploads,
      parent,
      quotedMessage,
      text,
    };
  }, [
    attachments,
    cancelURLEnrichment,
    editedMessage,
    findAndEnqueueURLsToEnrich,
    lastChange,
    linkPreviews,
    messageDraft,
    mentioned_users,
    numberOfUploads,
    parent,
    quotedMessage,
    text,
    messageDraftsEnabled,
    channel,
  ]);

  useEffect(() => {
    // delete the draft if composer is empty
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    const quotedMessageRemovedLocally =
      !quotedMessage && !!draftPrereqRefs.current.messageDraft?.message.quoted_message_id;
    // use lastChange to prevent ignoring a draft that was received via draft.updated event (draft created in another window / device)
    const localMessageChangeIsLast =
      !!messageDraft &&
      (lastChange?.getTime() ?? 0) > new Date(messageDraft.created_at).getTime();
    const shouldClear =
      messageDraft &&
      (localMessageChangeIsLast || quotedMessageRemovedLocally) &&
      !text &&
      !attachments?.length &&
      !quotedMessage;
    if (!shouldClear) return;

    const deletePayload: { parent_id?: string } = {};
    if (messageDraft.parent_id) {
      deletePayload.parent_id = messageDraft.parent_id;
    }
    channel.deleteDraft(deletePayload);
  }, [
    attachments,
    channel,
    lastChange,
    messageDraft,
    messageDraftsEnabled,
    quotedMessage,
    text,
  ]);

  useEffect(() => {
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    return channel.on('draft.updated', (event: Event) => {
      const draft = event.draft as DraftResponse;
      const { attachments, linkPreviews, mentioned_users, text } = initState({
        attachments: draft.message?.attachments ?? [],
        mentioned_users:
          draft.message?.mentioned_users?.map((userId) => ({ id: userId })) ?? [],
        text: draft.message?.text ?? '',
      } as Pick<LocalMessage, 'attachments' | 'mentioned_users' | 'text'>);
      setComposerState({
        attachments,
        lastChange: new Date(),
        linkPreviews,
        mentioned_users,
        text,
      });
    }).unsubscribe;
  }, [channel, messageComposer, messageDraftsEnabled, setComposerState]);

  useEffect(() => {
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    return channel.on('draft.deleted', () => {
      setComposerState({
        ...initState(),
        lastChange: new Date(),
      });
    }).unsubscribe;
  }, [channel, messageDraftsEnabled, setComposerState]);

  useEffect(() => {
    // create draft when leaving the channel
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !client || !channel) return;

    return () => {
      const { message, notification } = prepareMessage({
        attachments: draftPrereqRefs.current.attachments,
        cancelURLEnrichment: draftPrereqRefs.current.cancelURLEnrichment,
        findAndEnqueueURLsToEnrich: draftPrereqRefs.current.findAndEnqueueURLsToEnrich,
        linkPreviews: draftPrereqRefs.current.linkPreviews,
        mentioned_users: draftPrereqRefs.current.mentioned_users,
        numberOfUploads: draftPrereqRefs.current.numberOfUploads,
        text: draftPrereqRefs.current.text,
      });

      const hasData = !!(draftPrereqRefs.current.quotedMessage || message);
      const quotedMessageAddedLocally =
        !!draftPrereqRefs.current.quotedMessage?.id &&
        !draftPrereqRefs.current.messageDraft?.message.quoted_message_id; // todo: check if quoted_message is returned from channel query
      const messageUpdatedLocally =
        draftPrereqRefs.current.lastChange &&
        draftPrereqRefs.current.lastChange >
          new Date(draftPrereqRefs.current.messageDraft?.created_at ?? 0);

      const shouldCreateDraft =
        hasData && (messageUpdatedLocally || quotedMessageAddedLocally);

      if (!shouldCreateDraft || notification?.type === 'error') return;

      const draftMessagePayload: DraftMessagePayload = {
        ...message,
        id:
          draftPrereqRefs.current.messageDraft?.message.id ||
          generateMessageId({ client }),
        mentioned_users: message?.mentioned_users.map((u) => u.id),
        text: message?.text ?? '',
      };

      if (draftPrereqRefs.current.parent?.id) {
        draftMessagePayload.parent_id = draftPrereqRefs.current.parent.id;
      }
      if (draftPrereqRefs.current.quotedMessage) {
        draftMessagePayload.quoted_message_id = draftPrereqRefs.current.quotedMessage.id;
      }
      channel.createDraft(draftMessagePayload);
    };
  }, [channel, client, messageDraftsEnabled]);

  return children;
};
