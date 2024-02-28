import React from 'react';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type { DefaultStreamChatGenerics } from '../../types/types';

import { useMessageContext } from '../../context/MessageContext';
import { Timestamp } from './Timestamp';

export const defaultTimestampFormat = 'h:mmA';

export type MessageTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = {
  /* If true, call the `Day.js` calendar function to get the date string to display. */
  calendar?: boolean;
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* Overrides the default timestamp format */
  format?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value from `MessageContext`) */
  message?: StreamMessage<StreamChatGenerics>;
};

const UnMemoizedMessageTimestamp = <
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
>(
  props: MessageTimestampProps<StreamChatGenerics>,
) => {
  const { message: propMessage, ...timestampProps } = props;
  const { message: contextMessage } = useMessageContext<StreamChatGenerics>('MessageTimestamp');
  const message = propMessage || contextMessage;
  return <Timestamp timestamp={message.created_at} {...timestampProps} />;
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
