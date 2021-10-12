import { useEffect, useRef } from 'react';

import { useChatContext } from '../../../context/ChatContext';

import type { StreamMessage } from '../../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../../types/types';

export type ContainerMeasures = {
  offsetHeight: number;
  scrollHeight: number;
};

export type UseMessageListScrollManagerParams<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  messages: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[];
  onScrollBy: (scrollBy: number) => void;
  scrollContainerMeasures: () => ContainerMeasures;
  scrolledUpThreshold: number;
  scrollToBottom: () => void;
  showNewMessages: () => void;
};

export function useMessageListScrollManager<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(params: UseMessageListScrollManagerParams<At, Ch, Co, Ev, Me, Re, Us>) {
  const {
    onScrollBy,
    scrollContainerMeasures,
    scrolledUpThreshold,
    scrollToBottom,
    showNewMessages,
  } = params;

  const { client } = useChatContext<At, Ch, Co, Ev, Me, Re, Us>('useMessageListScrollManager');

  const measures = useRef<ContainerMeasures>({
    offsetHeight: 0,
    scrollHeight: 0,
  });
  const messages = useRef<StreamMessage<At, Ch, Co, Ev, Me, Re, Us>[]>();
  const scrollTop = useRef(0);

  useEffect(() => {
    scrollToBottom();
  }, []);

  useEffect(() => {
    const prevMeasures = measures.current;
    const prevMessages = messages.current;
    const newMessages = params.messages;
    const lastNewMessage = newMessages[newMessages.length - 1] || {};
    const lastPrevMessage = prevMessages?.[prevMessages.length - 1];
    const newMeasures = scrollContainerMeasures();

    const wasAtBottom =
      prevMeasures.scrollHeight - prevMeasures.offsetHeight - scrollTop.current <
      scrolledUpThreshold;

    if (typeof prevMessages !== 'undefined') {
      if (prevMessages.length < newMessages.length) {
        // messages added to the top
        if (lastPrevMessage?.id === lastNewMessage.id) {
          const listHeightDelta = newMeasures.scrollHeight - prevMeasures.scrollHeight;

          onScrollBy(listHeightDelta);
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
  }, [measures, messages, params.messages]);

  return (scrollTopValue: number) => {
    scrollTop.current = scrollTopValue;
  };
}
