import type React from 'react';
import { useMemo } from 'react';

import { useLastReadData } from '../useLastReadData';
import type { GroupStyle, RenderedMessage } from '../../utils';
import { getLastReceived } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { LocalMessage, UnreadSnapshotState } from 'stream-chat';
// import type { ChannelUnreadUiState } from '../../../../types/types';
import type { MessageRenderer, SharedMessageProps } from '../../renderMessages';
import { useChannelStateContext } from '../../../../context';
import { useLastDeliveredData } from '../useLastDeliveredData';
import { useStateStore } from '../../../../store';

type UseMessageListElementsProps = {
  messages: LocalMessage[];
  enrichedMessages: RenderedMessage[];
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  threadList: boolean;
  // channelUnreadUiState?: ChannelUnreadUiState;
  lastOwnMessage?: LocalMessage;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => state;

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    enrichedMessages,
    internalMessageProps,
    lastOwnMessage,
    messageGroupStyles,
    messages,
    renderMessages,
    returnAllReadData,
    threadList,
  } = props;

  const { customClasses } = useChatContext('useMessageListElements');
  const { channel } = useChannelStateContext();
  const components = useComponentContext('useMessageListElements');
  const channelUnreadUiState = useStateStore(
    channel.messagePaginator.unreadStateSnapshot,
    unreadStateSnapshotSelector,
  );
  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    channel,
    lastOwnMessage,
    messages,
    returnAllReadData,
  });

  const ownMessagesDeliveredToOthers = useLastDeliveredData({
    channel,
    lastOwnMessage,
    messages,
    returnAllReadData,
  });

  const lastReceivedMessageId = useMemo(
    () => getLastReceived(enrichedMessages),
    [enrichedMessages],
  );

  const elements: React.ReactNode[] = useMemo(
    () =>
      renderMessages({
        channelUnreadUiState,
        components,
        customClasses,
        lastOwnMessage,
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        ownMessagesDeliveredToOthers,
        readData,
        sharedMessageProps: { ...internalMessageProps, returnAllReadData, threadList },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enrichedMessages,
      internalMessageProps,
      lastOwnMessage,
      lastReceivedMessageId,
      messageGroupStyles,
      channelUnreadUiState,
      readData,
      renderMessages,
      returnAllReadData,
      threadList,
    ],
  );

  return elements;
};
