import React, { useMemo } from 'react';

import { useLastReadData } from '../useLastReadData';
import { getLastReceived, GroupStyle } from '../../utils';

import { useChatContext } from '../../../../context/ChatContext';
import { useComponentContext } from '../../../../context/ComponentContext';

import type { ChannelState as StreamChannelState } from 'stream-chat';
import type { StreamMessage } from '../../../../context/ChannelStateContext';

import type { DefaultStreamChatGenerics, OwnChannelReadState } from '../../../../types/types';
import { MessageRenderer, SharedMessageProps } from '../../renderMessages';

type UseMessageListElementsProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  enrichedMessages: StreamMessage<StreamChatGenerics>[];
  internalMessageProps: SharedMessageProps<StreamChatGenerics>;
  messageGroupStyles: Record<string, GroupStyle>;
  renderMessages: MessageRenderer<StreamChatGenerics>;
  returnAllReadData: boolean;
  threadList: boolean;
  ownReadState?: OwnChannelReadState<StreamChatGenerics>;
  read?: StreamChannelState<StreamChatGenerics>['read'];
};

export const useMessageListElements = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: UseMessageListElementsProps<StreamChatGenerics>,
) => {
  const {
    enrichedMessages,
    internalMessageProps,
    messageGroupStyles,
    ownReadState,
    read,
    renderMessages,
    returnAllReadData,
    threadList,
  } = props;

  const { client, customClasses } = useChatContext<StreamChatGenerics>('useMessageListElements');
  const components = useComponentContext<StreamChatGenerics>('useMessageListElements');

  // get the readData, but only for messages submitted by the user themselves
  const readData = useLastReadData({
    messages: enrichedMessages,
    read,
    returnAllReadData,
    userID: client.userID,
  });

  const lastReceivedMessageId = useMemo(() => getLastReceived(enrichedMessages), [
    enrichedMessages,
  ]);

  const elements: React.ReactNode[] = useMemo(
    () =>
      renderMessages({
        components,
        customClasses,
        lastReceivedMessageId,
        messageGroupStyles,
        messages: enrichedMessages,
        ownReadState,
        readData,
        sharedMessageProps: { ...internalMessageProps, threadList },
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      enrichedMessages,
      internalMessageProps,
      lastReceivedMessageId,
      messageGroupStyles,
      ownReadState,
      readData,
      renderMessages,
      threadList,
    ],
  );

  return elements;
};
