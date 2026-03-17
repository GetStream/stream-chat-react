import React, { useState } from 'react';
import type { LocalMessage } from 'stream-chat';
import type { TimestampFormatterOptions } from '../../i18n/types';
import { PopperTooltip } from '../Tooltip';
import { useEnterLeaveHandlers } from '../Tooltip/hooks';
import { Timestamp as DefaultTimestamp } from './Timestamp';
import {
  useComponentContext,
  useMessageContext,
  useTranslationContext,
} from '../../context';

export type MessageEditedIndicatorProps = TimestampFormatterOptions & {
  /* Adds a CSS class name to the component's outer container. */
  customClass?: string;
  /* The `StreamChat` message object, which provides necessary data to the underlying UI components (overrides the value from `MessageContext`) */
  message?: LocalMessage;
};

const UnMemoizedMessageEditedIndicator = (props: MessageEditedIndicatorProps) => {
  const { customClass, message: propMessage, ...timestampProps } = props;
  const { message: contextMessage } = useMessageContext('MessageEditedIndicator');
  const { t } = useTranslationContext('MessageEditedIndicator');
  const { Timestamp = DefaultTimestamp } = useComponentContext('MessageEditedIndicator');
  const message = propMessage ?? contextMessage;

  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLSpanElement>();

  if (!message?.message_text_updated_at) {
    return null;
  }

  return (
    <span
      className={customClass ?? 'str-chat__message-edited-indicator'}
      data-testid='message-edited-indicator'
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      ref={setReferenceElement}
    >
      {t('Edited')}
      <PopperTooltip
        offset={[0, 5]}
        placement='top'
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        <Timestamp timestamp={message.message_text_updated_at} {...timestampProps} />
      </PopperTooltip>
    </span>
  );
};

export const MessageEditedIndicator = React.memo(
  UnMemoizedMessageEditedIndicator,
) as typeof UnMemoizedMessageEditedIndicator;
