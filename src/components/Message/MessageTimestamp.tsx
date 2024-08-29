import React from 'react';
import { useMessageContext } from '../../context/MessageContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { useComponentContext } from '../../context/ComponentContext';

import type { StreamMessage } from '../../context/ChannelStateContext';
import type { DefaultStreamChatGenerics } from '../../types/types';
import type { TimestampFormatterOptions } from '../../i18n/utils';

export type MessageTimestampProps<
  StreamChatGenerics extends DefaultStreamChatGenerics = DefaultStreamChatGenerics
> = TimestampFormatterOptions & {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
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
  const { Timestamp = DefaultTimestamp } = useComponentContext('MessageTimestamp');
  const message = propMessage || contextMessage;
  return <Timestamp timestamp={message.created_at} {...timestampProps} />;
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
