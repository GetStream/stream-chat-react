import type React from 'react';
import { useMemo } from 'react';

import { useLastReadData } from '../useLastReadData';
import type { GroupStyle, RenderedMessage } from '../../utils';
import { getLastReceived } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { LocalMessage } from 'stream-chat';
import type { ChannelUnreadUiState } from '../../../../types/types';
import type { MessageRenderer, SharedMessageProps } from '../../renderMessages';
import { useChannel } from '../../../../context';
import { useLastDeliveredData } from '../useLastDeliveredData';

type UseMessageListElementsProps = {
  messages: LocalMessage[];
  enrichedMessages: RenderedMessage[];
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  channelUnreadUiState?: ChannelUnreadUiState;
  lastOwnMessage?: LocalMessage;
};

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    channelUnreadUiState,
    enrichedMessages,
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
        lastOwnMessage,
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        ownMessagesDeliveredToOthers,
        readData,
        sharedMessageProps: { ...internalMessageProps, returnAllReadData },
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
    ],
  );

  return elements;
};
