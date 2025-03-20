import { useEffect, useMemo, useRef, useState } from 'react';
import type { TextComposerMiddleware } from 'stream-chat';
import {
  createCommandsMiddleware,
  createMentionsMiddleware,
  MessageComposer,
} from 'stream-chat';
import type { DraftResponse } from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import type { StreamMessage } from '../../../../context';
import {
  useChannelStateContext,
  useChatContext,
  useMessageInputContext,
} from '../../../../context';

export type UseMessageComposerParams = {
  message?: DraftResponse | StreamMessage;
  textComposerMiddleware?: TextComposerMiddleware[];
};

export const useMessageComposer = ({
  textComposerMiddleware,
}: UseMessageComposerParams = {}) => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const { message: editedMessage } = useMessageInputContext();
  // legacy thread will receive new composer
  const { thread: parentMessage } = useChannelStateContext();
  const thread = useThreadContext();
  const detachedMesssageComposerRef = useRef<MessageComposer>(
    new MessageComposer({ channel }),
  );

  const [cachedEditedMessage, setCachedEditedMessage] = useState<
    StreamMessage | undefined
  >(editedMessage);
  const [cachedParentMessage, setCachedParentMessage] = useState<
    StreamMessage | undefined
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
      composer.textComposer.use(
        textComposerMiddleware ??
          ([
            createCommandsMiddleware(channel),
            createMentionsMiddleware(client),
          ] as TextComposerMiddleware[]),
      );
      return composer;
    } else if (thread) {
      return thread.messageComposer;
    } else if (cachedParentMessage) {
      const composer = new MessageComposer({ channel, threadId: cachedParentMessage.id });
      composer.textComposer.use(
        textComposerMiddleware ??
          ([
            createCommandsMiddleware(channel),
            createMentionsMiddleware(client),
          ] as TextComposerMiddleware[]),
      );
      return composer;
    } else if (channel) {
      return channel.messageComposer;
    } else {
      // should never reach this point
      return detachedMesssageComposerRef.current;
    }
  }, [
    cachedEditedMessage,
    cachedParentMessage,
    channel,
    client,
    textComposerMiddleware,
    thread,
  ]);

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
