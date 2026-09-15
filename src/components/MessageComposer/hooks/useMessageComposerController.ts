import { useEffect, useMemo } from 'react';
import type { MessageComposer as MessageComposerController } from 'stream-chat';
import { useThreadContext } from '../../Threads';
import { useChannel, useChatContext } from '../../../context';

export const useMessageComposerController = () => {
  const { client } = useChatContext();
  const { messageComposerCache: queueCache } = client;
  const channel = useChannel();
  const threadInstance = useThreadContext();

  // composer hierarchy: thread instance (own) -> channel (own)
  const messageComposer = useMemo(
    () => threadInstance?.messageComposer ?? channel.messageComposer,
    [channel, threadInstance],
  );

  // `legacy_thread` used to be reachable here too, from a composer built off a parent message; the
  // only composers this hook resolves now belong to a thread or a channel.
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
