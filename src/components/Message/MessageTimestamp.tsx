import React from 'react';
import { useMessageContext } from '../../context/MessageContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { useComponentContext } from '../../context';

import type { LocalMessage } from 'stream-chat';
import type { TimestampFormatterOptions } from '../../i18n/types';

export type MessageTimestampProps = TimestampFormatterOptions & {
  /* Adds a CSS class name to the component's outer `time` container. */
  customClass?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value from `MessageContext`) */
  message?: LocalMessage;
};

const UnMemoizedMessageTimestamp = (props: MessageTimestampProps) => {
  const { message: propMessage, ...timestampProps } = props;
  const { message: contextMessage } = useMessageContext('MessageTimestamp');
  const { Timestamp = DefaultTimestamp } = useComponentContext('MessageTimestamp');
  const message = propMessage || contextMessage;
  return <Timestamp timestamp={message.created_at} {...timestampProps} />;
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
