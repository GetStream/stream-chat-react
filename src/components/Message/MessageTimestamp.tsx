import { convertTimestampToDate } from 'stream-chat';
import React, { useContext } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { useComponentContext } from '../../context';
import { requireContext } from '../../context/requireContext';

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
  // With a `message` prop it also renders outside a message (e.g. the gallery header). Without one
  // it needs the surrounding message, and says so like `useMessageContext()` does.
  const messageContext = useContext(MessageContext);
  const { Timestamp = DefaultTimestamp } = useComponentContext();
  const message =
    propMessage ||
    requireContext(messageContext, 'MessageTimestamp', 'MessageProvider').message;
  return (
    <Timestamp
      timestamp={convertTimestampToDate(message.created_at)}
      {...timestampProps}
    />
  );
};

export const MessageTimestamp = React.memo(
  UnMemoizedMessageTimestamp,
) as typeof UnMemoizedMessageTimestamp;
