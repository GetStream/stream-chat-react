import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageComposer } from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import { useChannelStateContext, useMessageInputContext } from '../../../../context';
import type { LocalMessage, TextComposerMiddleware } from 'stream-chat';

export type UseMessageComposerParams = {
  textComposerMiddleware?: TextComposerMiddleware[];
};

export const useMessageComposer = ({
  textComposerMiddleware,
}: UseMessageComposerParams = {}) => {
  const { channel } = useChannelStateContext();
  const { message: editedMessage } = useMessageInputContext();
  // legacy thread will receive new composer
  const { thread: parentMessage } = useChannelStateContext();
  const thread = useThreadContext();
  const detachedMessageComposerRef = useRef<MessageComposer>(
    new MessageComposer({ channel }),
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
      const composer = new MessageComposer({ channel, composition: cachedEditedMessage });
      // todo: remove with factory functions introduction
      if (textComposerMiddleware) composer.textComposer.use(textComposerMiddleware);
      return composer;
    } else if (thread) {
      return thread.messageComposer;
    } else if (cachedParentMessage) {
      const composer = new MessageComposer({ channel, threadId: cachedParentMessage.id });
      // todo: remove with factory functions introduction
      if (textComposerMiddleware) composer.textComposer.use(textComposerMiddleware);
      return composer;
    } else if (channel) {
      return channel.messageComposer;
    } else {
      // should never reach this point
      return detachedMessageComposerRef.current;
    }
  }, [cachedEditedMessage, cachedParentMessage, channel, textComposerMiddleware, thread]);

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
