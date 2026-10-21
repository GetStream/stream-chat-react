import { convertTimestampToDate } from 'stream-chat';
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
  /** Replaces the default `str-chat__message-edited-indicator` class on the outer `span`. */
  customClass?: string;
  /** Message to render; overrides the one from `MessageContext`. */
  message?: LocalMessage;
};

const UnMemoizedMessageEditedIndicator = (props: MessageEditedIndicatorProps) => {
  const { customClass, message: propMessage, ...timestampProps } = props;
  const { message: contextMessage } = useMessageContext();
  const { t } = useTranslationContext();
  const { Timestamp = DefaultTimestamp } = useComponentContext();
  const message = propMessage ?? contextMessage;

  const [referenceElement, setReferenceElement] = useState<HTMLSpanElement | null>(null);
  const { handleEnter, handleLeave, tooltipVisible } =
    useEnterLeaveHandlers<HTMLSpanElement>();

  if (message?.message_text_updated_at == null) {
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
      {t('message.editedIndicator.edited.text', 'Edited')}
      <PopperTooltip
        offset={[0, 5]}
        placement='top'
        referenceElement={referenceElement}
        visible={tooltipVisible}
      >
        <Timestamp
          timestamp={convertTimestampToDate(message.message_text_updated_at)}
          {...timestampProps}
        />
      </PopperTooltip>
    </span>
  );
};

export const MessageEditedIndicator = React.memo(
  UnMemoizedMessageEditedIndicator,
) as typeof UnMemoizedMessageEditedIndicator;
