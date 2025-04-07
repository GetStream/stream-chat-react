import { useEffect, useMemo, useRef, useState } from 'react';
import { FixedSizeQueueCache, MessageComposer } from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import { useChatContext, useMessageInputContext } from '../../../../context';
import type { LocalMessage } from 'stream-chat';
import { useLegacyThreadContext } from '../../../Thread';

export type UseMessageComposerParams = unknown;

const queueCache = new FixedSizeQueueCache<string, MessageComposer>(64);

export const useMessageComposer = () => {
  const { channel, client } = useChatContext();
  const { message: editedMessage } = useMessageInputContext();
  // legacy thread will receive new composer
  const { legacyThread: parentMessage, messageDraft } = useLegacyThreadContext();
  const threadInstance = useThreadContext();
  const detachedMessageComposerRef = useRef<MessageComposer>(
    new MessageComposer({
      client,
      compositionContext: {
        created_at: new Date(),
        deleted_at: null,
        id: 'detached',
        pinned_at: null,
        status: '',
        type: 'regular',
        updated_at: new Date(),
      },
    }),
  );

  const [cachedEditedMessage, setCachedEditedMessage] = useState<
    LocalMessage | undefined
  >(editedMessage);
  const [cachedParentMessage, setCachedParentMessage] = useState<
    LocalMessage | undefined
  >(parentMessage ?? undefined);

  if (editedMessage?.id !== cachedEditedMessage?.id) {
    setCachedEditedMessage(editedMessage);
  }

  if (parentMessage?.id !== cachedParentMessage?.id) {
    setCachedParentMessage(parentMessage ?? undefined);
  }

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;
  const messageComposer = useMemo(() => {
    if (cachedEditedMessage) {
      const tag = MessageComposer.constructTag(cachedEditedMessage);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) return cachedComposer;

      return new MessageComposer({
        client,
        composition: cachedEditedMessage,
        compositionContext: cachedEditedMessage,
      });
    } else if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const compositionContext = {
        ...cachedParentMessage,
        legacyThreadId: cachedParentMessage.id,
      };

      const tag = MessageComposer.constructTag(compositionContext);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) return cachedComposer;

      // FIXME: draft won't be applied on second render
      return new MessageComposer({
        client,
        composition: messageDraft,
        compositionContext,
      });
    } else if (channel) {
      return channel.messageComposer;
    } else {
      // should never reach this point
      return detachedMessageComposerRef.current;
    }
  }, [
    cachedEditedMessage,
    cachedParentMessage,
    channel,
    client,
    messageDraft,
    threadInstance,
  ]);

  if (
    (['legacy_thread', 'message'] as MessageComposer['contextType'][]).includes(
      messageComposer.contextType,
    ) &&
    !queueCache.peek(messageComposer.tag)
  ) {
    queueCache.add(messageComposer.tag, messageComposer);
  }

  useEffect(() => {
    const unsubscribe = messageComposer.registerSubscriptions();
    return () => {
      unsubscribe();
    };
  }, [messageComposer]);

  return messageComposer;
};
