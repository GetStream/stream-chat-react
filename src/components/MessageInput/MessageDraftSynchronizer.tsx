import { useEffect, useRef } from 'react';
import { generateMessageId } from '../Channel/utils';
import { EnrichURLsController } from './hooks/useLinkPreviews';
import { prepareMessage } from './hooks/useSubmitHandler';
import { initState } from './hooks/useMessageInputState/initMessageInputState';
import {
  StreamMessage,
  useChannelActionContext,
  useChannelStateContext,
  useChatContext,
  useMessageInputContext,
} from '../../context';
import type {
  DraftMessagePayload,
  DraftResponse,
  Event,
  MessageComposerState,
  UserResponse,
} from 'stream-chat';
import type { LinkPreviewMap, LocalAttachment } from './types';
import type { DefaultStreamChatGenerics, PropsWithChildrenOnly } from '../../types/types';
import { useMessageComposer } from './hooks/messageComposer/useMessageComposer';
import { useStateStore } from '../../store';

type MessageDraftRefs<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = Pick<EnrichURLsController, 'cancelURLEnrichment' | 'findAndEnqueueURLsToEnrich'> & {
  attachments: LocalAttachment<StreamChatGenerics>[];
  lastChange: Date | undefined;
  linkPreviews: LinkPreviewMap;
  mentioned_users: UserResponse<StreamChatGenerics>[];
  numberOfUploads: number;
  text: string;
  editedMessage?: StreamMessage<StreamChatGenerics>;
  messageDraft: DraftResponse<StreamChatGenerics> | null;
  parent?: StreamMessage<StreamChatGenerics>;
  quotedMessage: StreamMessage<StreamChatGenerics> | null;
};

const messageComposerStateSelector = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>(
  state: MessageComposerState<SCG>,
): Pick<MessageComposerState<SCG>, 'quotedMessage'> => ({
  quotedMessage: state.quotedMessage,
});

// FIXME: Move all the logic from this component to the LLC Channel reactive state
export const MessageDraftSynchronizer = <
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  children,
}: PropsWithChildrenOnly) => {
  const { client } = useChatContext<SCG>();
  const { channel, messageDraft, messageDraftsEnabled } = useChannelStateContext<SCG>();
  const messageComposer = useMessageComposer<SCG>();
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
  } = useMessageInputContext<SCG>();

  const draftPrereqRefs = useRef<MessageDraftRefs<SCG>>({
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
    channel.deleteMessageDraft(deletePayload);
  }, [attachments, channel, lastChange, messageDraft, quotedMessage, text]);

  useEffect(() => {
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    return channel.on('draft.updated', (event: Event) => {
      const draft = event.draft as DraftResponse<SCG>;
      const { attachments, linkPreviews, mentioned_users, text } = initState({
        attachments: draft.message?.attachments ?? [],
        mentioned_users: draft.message?.mentioned_users ?? [],
        text: draft.message?.text ?? '',
      } as Pick<StreamMessage<SCG>, 'attachments' | 'mentioned_users' | 'text'>);
      setComposerState({
        attachments,
        lastChange: new Date(),
        linkPreviews,
        mentioned_users,
        text,
      });
    }).unsubscribe;
  }, [channel, messageComposer, setComposerState]);

  useEffect(() => {
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !channel) return;

    return channel.on('draft.deleted', () => {
      setComposerState({
        ...initState(),
        lastChange: new Date(),
      });
    }).unsubscribe;
  }, [channel, setComposerState]);

  useEffect(() => {
    // create draft when leaving the channel
    if (!messageDraftsEnabled) return;
    if (draftPrereqRefs.current.editedMessage || !client || !channel) return;

    return () => {
      const { message, notification } = prepareMessage<SCG>({
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

      const draftMessagePayload: DraftMessagePayload<SCG> = {
        ...message,
        id:
          draftPrereqRefs.current.messageDraft?.message.id ||
          generateMessageId<SCG>({ client }),
        mentioned_users: message?.mentioned_users.map((u) => u.id),
        text: message?.text ?? '',
      };

      if (draftPrereqRefs.current.parent?.id) {
        draftMessagePayload.parent_id = draftPrereqRefs.current.parent.id;
      }
      if (draftPrereqRefs.current.quotedMessage) {
        draftMessagePayload.quoted_message_id = draftPrereqRefs.current.quotedMessage.id;
      }
      channel.draftMessage(draftMessagePayload);
    };
  }, [channel, client]);

  return children;
};
