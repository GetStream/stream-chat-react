import type React from 'react';
import { useMemo } from 'react';

import { useLastReadData } from '../useLastReadData';
import { getLastReceived } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { ChannelState as StreamChannelState } from 'stream-chat';

import type { GroupStyle, RenderedMessage } from '../../utils';
import type { ChannelUnreadUiState } from '../../../../types/types';
import type { MessageRenderer, SharedMessageProps } from '../../renderMessages';

type UseMessageListElementsProps = {
  enrichedMessages: RenderedMessage[];
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  threadList: boolean;
  channelUnreadUiState?: ChannelUnreadUiState;
  read?: StreamChannelState['read'];
};

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    channelUnreadUiState,
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    read,
    renderMessages,
    returnAllReadData,
    threadList,
  } = props;

  const { client, customClasses } = useChatContext('useMessageListElements');
  const components = useComponentContext('useMessageListElements');

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    messages: enrichedMessages,
    read,
    returnAllReadData,
    userID: client.userID,
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
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        readData,
        sharedMessageProps: { ...internalMessageProps, threadList },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enrichedMessages,
      internalMessageProps,
      lastReceivedMessageId,
      messageGroupStyles,
      channelUnreadUiState,
      readData,
      renderMessages,
      threadList,
    ],
  );

  return elements;
};
