import { useEffect, useMemo } from 'react';
import type { TextComposerMiddleware } from 'stream-chat';
import {
  createCommandsMiddleware,
  createMentionsMiddleware,
  type DraftResponse,
  MessageComposer,
} from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import {
  type StreamMessage,
  useChannelStateContext,
  useChatContext,
  useMessageInputContext,
} from '../../../../context';

export type UseMessageComposerParams = {
  message?: DraftResponse | StreamMessage;
  textComposerMiddleware?: TextComposerMiddleware[];
};

export const useMessageComposer = ({
  message,
  textComposerMiddleware,
}: UseMessageComposerParams = {}) => {
  const { client } = useChatContext();
  const { channel } = useChannelStateContext();
  const thread = useThreadContext();
  const { messageComposer: inputMessageComposer } = useMessageInputContext();

  const messageComposer = useMemo(() => {
    if (inputMessageComposer) return inputMessageComposer;
    if (message) {
      const newMessageComposer = new MessageComposer({
        channel,
        composition: message,
        threadId: thread?.id,
      });

      newMessageComposer.textComposer.use(
        textComposerMiddleware ??
          ([
            createCommandsMiddleware(channel),
            createMentionsMiddleware(client),
          ] as TextComposerMiddleware[]),
      );
      return newMessageComposer;
    }

    return thread?.messageComposer ?? channel.messageComposer;
  }, [channel, client, inputMessageComposer, message, textComposerMiddleware, thread]);

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
