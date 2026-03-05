import type React from 'react';
import { useMemo } from 'react';

import { useLastReadData } from '../useLastReadData';
import type { GroupStyle, RenderedMessage } from '../../utils';
import { getLastReceived } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { LocalMessage, UnreadSnapshotState } from 'stream-chat';
import type { MessageRenderer, SharedMessageProps } from '../../renderMessages';
import { useChannel } from '../../../../context';
import { useLastDeliveredData } from '../useLastDeliveredData';
import { useStateStore } from '../../../../store';

type UseMessageListElementsProps = {
  messages: LocalMessage[];
  enrichedMessages: RenderedMessage[];
  focusedMessageId?: string | null;
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  lastOwnMessage?: LocalMessage;
};

const unreadStateSnapshotSelector = (state: UnreadSnapshotState) => state;

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    enrichedMessages,
    focusedMessageId,
    internalMessageProps,
    lastOwnMessage,
    messageGroupStyles,
    messages,
    renderMessages,
    returnAllReadData,
  } = props;

  const { customClasses } = useChatContext('useMessageListElements');
  const channel = useChannel();
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
        channel,
        channelUnreadUiState,
        components,
        customClasses,
        focusedMessageId,
        lastOwnMessage,
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        ownMessagesDeliveredToOthers,
        readData,
        sharedMessageProps: { ...internalMessageProps, returnAllReadData },
      }),
    [
      channel,
      channelUnreadUiState,
      components,
      customClasses,
      enrichedMessages,
      focusedMessageId,
      internalMessageProps,
      lastOwnMessage,
      lastReceivedMessageId,
      messageGroupStyles,
      ownMessagesDeliveredToOthers,
      readData,
      renderMessages,
      returnAllReadData,
    ],
  );

  return elements;
};
