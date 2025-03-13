import { useEffect, useMemo } from 'react';
import {
  createCommandsMiddleware,
  createMentionsMiddleware,
  type DraftResponse,
  MessageComposer,
  TextComposerMiddleware,
} from 'stream-chat';
import { useThreadContext } from '../../../Threads';
import {
  type StreamMessage,
  useChannelStateContext,
  useChatContext,
  useMessageInputContext,
} from '../../../../context';
import type { DefaultStreamChatGenerics } from '../../../../types';

export type UseMessageComposerParams<
  SCG extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
> = {
  message?: DraftResponse<SCG> | StreamMessage<SCG>;
  textComposerMiddleware?: TextComposerMiddleware<SCG>[];
};

export const useMessageComposer = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics,
>({
  message,
  textComposerMiddleware,
}: UseMessageComposerParams<StreamChatGenerics> = {}) => {
  const { client } = useChatContext<StreamChatGenerics>();
  const { channel } = useChannelStateContext<StreamChatGenerics>();
  const thread = useThreadContext<StreamChatGenerics>();
  const { messageComposer: inputMessageComposer } =
    useMessageInputContext<StreamChatGenerics>();

  const messageComposer = useMemo(() => {
    if (inputMessageComposer) return inputMessageComposer;
    if (message) {
      const newMessageComposer = new MessageComposer<StreamChatGenerics>({
        channel,
        composition: message,
        threadId: thread?.id,
      });

      newMessageComposer.textComposer.use(
        textComposerMiddleware ??
          ([
            createCommandsMiddleware(channel),
            createMentionsMiddleware(client),
          ] as TextComposerMiddleware<StreamChatGenerics>[]),
      );
      return newMessageComposer;
    }

    return thread?.messageComposer ?? channel.messageComposer;
  }, [channel, client, inputMessageComposer, message, thread]);

  useEffect(() => {
    messageComposer.registerSubscriptions();
    return () => {
      messageComposer.unregisterSubscriptions();
    };
  }, [messageComposer]);

  return messageComposer;
};
