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

  // composer hierarchy: supplied by the integrator -> thread instance (own) -> channel (own)
  const messageComposer = useMemo(
    () => suppliedComposer ?? threadInstance?.messageComposer ?? channel.messageComposer,
    [channel, suppliedComposer, threadInstance],
  );

  // Only a supplied composer can carry a message context (an edit); the thread's and channel's own
  // never do.
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
