import { convertTimestampToDate } from 'stream-chat';
import React, { useContext } from 'react';
import { MessageContext } from '../../context/MessageContext';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import { useComponentContext } from '../../context';
import { requireContext } from '../../context/requireContext';

import type { LocalMessage } from 'stream-chat';
import type { TimestampFormatterOptions } from '../../i18n/types';

export type MessageTimestampProps = TimestampFormatterOptions & {
  /** Class name for the outer `time` element. */
  customClass?: string;
  /** Message to render; overrides the one from `MessageContext`. */
  message?: LocalMessage;
};

const UnMemoizedMessageTimestamp = (props: MessageTimestampProps) => {
  const { message: propMessage, ...timestampProps } = props;
  // Renders outside a message when given a `message` prop (e.g. the gallery header); otherwise it
  // requires a `MessageProvider`.
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
