import { useEffect, useMemo } from 'react';
import {
  FixedSizeQueueCache,
  MessageComposer as MessageComposerController,
} from 'stream-chat';
import { useThreadContext } from '../../Threads';
import { useChannelStateContext, useChatContext } from '../../../context';
import { useLegacyThreadContext } from '../../Thread';

const queueCache = new FixedSizeQueueCache<string, MessageComposerController>(64);

export const useMessageComposerController = () => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { legacyThread: parentMessage } = useLegacyThreadContext();
  const threadInstance = useThreadContext();

  const cachedParentMessage = useMemo(() => {
    if (!parentMessage) return undefined;

    return parentMessage;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentMessage?.id]);

  // composer hierarchy
  // edited message (always new) -> thread instance (own) -> thread message (always new) -> channel (own)
  // editedMessage ?? thread ?? parentMessage ?? channel;
  const messageComposer = useMemo(() => {
    if (threadInstance) {
      return threadInstance.messageComposer;
    } else if (cachedParentMessage) {
      const compositionContext = {
        ...cachedParentMessage,
        legacyThreadId: cachedParentMessage.id,
      };

      const tag = MessageComposerController.constructTag(compositionContext);

      const cachedComposer = queueCache.get(tag);
      if (cachedComposer) return cachedComposer;

      return new MessageComposerController({
        client,
        compositionContext,
      });
    } else {
      return channel.messageComposer;
    }
  }, [cachedParentMessage, channel, client, threadInstance]);

  if (
    (['legacy_thread', 'message'] as MessageComposerController['contextType'][]).includes(
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
