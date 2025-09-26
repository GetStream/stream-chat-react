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
import { useChannelStateContext } from '../../../../context';
import { useLastDeliveredData } from '../useLastDeliveredData';

type UseMessageListElementsProps = {
  messages: LocalMessage[];
  enrichedMessages: RenderedMessage[];
  internalMessageProps: SharedMessageProps;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer;
  returnAllReadData: boolean;
  threadList: boolean;
  channelUnreadUiState?: ChannelUnreadUiState;
};

export const useMessageListElements = (props: UseMessageListElementsProps) => {
  const {
    channelUnreadUiState,
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    messages,
    renderMessages,
    returnAllReadData,
    threadList,
  } = props;

  const { customClasses } = useChatContext('useMessageListElements');
  const { channel } = useChannelStateContext();
  const components = useComponentContext('useMessageListElements');

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    channel,
    messages,
    returnAllReadData,
  });

  const ownMessagesDeliveredToOthers = useLastDeliveredData({
    channel,
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
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        ownMessagesDeliveredToOthers,
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
