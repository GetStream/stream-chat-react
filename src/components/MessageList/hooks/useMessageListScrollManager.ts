import { useLayoutEffect, useRef } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics } from '../../../types/types';

export type ContainerMeasures = {
  offsetHeight: number;
  scrollHeight: number;
};

export type UseMessageListScrollManagerParams<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  listElement: HTMLDivElement | null;
  loadMoreScrollThreshold: number;
  messages: StreamMessage<StreamChatGenerics>[];
  scrolledUpThreshold: number;
  scrollToBottom: () => void;
  showNewMessages: () => void;
};

// FIXME: change this generic name to something like useAdjustScrollPositionToListSize
export function useMessageListScrollManager<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(params: UseMessageListScrollManagerParams<StreamChatGenerics>) {
  const {
    listElement,
    loadMoreScrollThreshold,
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages,
  } = params;

  const { client } = useChatContext<StreamChatGenerics>('useMessageListScrollManager');

  const measures = useRef<ContainerMeasures>({
    offsetHeight: 0,
    scrollHeight: 0,
  });
  const messages = useRef<StreamMessage<StreamChatGenerics>[]>();

  useLayoutEffect(() => {
    if (!listElement) return;

    const prevMeasures = measures.current;
    const newMeasures = {
      offsetHeight: listElement.offsetHeight || 0,
      scrollHeight: listElement.scrollHeight || 0,
    };
    const prevMessages = messages.current;
    const newMessages = params.messages;
    const lastNewMessage = newMessages[newMessages.length - 1] || {};
    const lastPrevMessage = prevMessages?.[prevMessages.length - 1];

    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - listElement.scrollTop <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      if (prevMessages.length < newMessages.length) {
        // messages added to the top
        if (lastPrevMessage?.id === lastNewMessage.id) {
          if (listElement.scrollTop < loadMoreScrollThreshold) {
            const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;
            listElement?.scrollBy({ top: listHeightDelta });
          }
        }
        // messages added to the bottom
        else {
          const lastMessageIsFromCurrentUser = lastNewMessage.user?.id === client.userID;

          if (lastMessageIsFromCurrentUser || wasAtBottom) {
            scrollToBottom();
          } else {
            showNewMessages();
          }
        }
      }
      // message list length didn't change, but check if last message had reaction/reply update
      else {
        const hasNewReactions =
          lastPrevMessage?.latest_reactions?.length !== lastNewMessage.latest_reactions?.length;
        const hasNewReplies = lastPrevMessage?.reply_count !== lastNewMessage.reply_count;

        if ((hasNewReactions || hasNewReplies) && wasAtBottom) {
          scrollToBottom();
        }
      }
    }

    messages.current = newMessages;
    measures.current = newMeasures;
  }, [measures, messages, params.messages, listElement]);
}
