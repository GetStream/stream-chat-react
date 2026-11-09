import { useEffect, useMemo } from 'react';
import type { MessageComposer as MessageComposerController } from 'stream-chat';
import { useThreadContext } from '../../Threads';
import {
  useChannel,
  useChatContext,
  useMessageComposerControllerContext,
} from '../../../context';

export const useMessageComposerController = () => {
  const { client } = useChatContext();
  const { messageComposerCache: queueCache } = client;
  const channel = useChannel();
  const threadInstance = useThreadContext();
  const suppliedComposer = useMessageComposerControllerContext();

  // Resolution order: the supplied composer, then the thread's own, then the channel's own.
  const messageComposer = useMemo(
    () => suppliedComposer ?? threadInstance?.messageComposer ?? channel.messageComposer,
    [channel, suppliedComposer, threadInstance],
  );

  // Caches a composer with a message context (an edit), which only a supplied composer can have.
  if (
    (['message'] as MessageComposerController['contextType'][]).includes(
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
