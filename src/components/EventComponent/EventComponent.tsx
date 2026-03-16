import React from 'react';

import type { Event, LocalMessage } from 'stream-chat';
import type { TimestampFormatterOptions } from '../../i18n/types';

export type EventComponentProps = TimestampFormatterOptions & {
  message: LocalMessage & {
    event?: Event;
  };
  unsafeHTML?: boolean;
};

/**
 * Component to display system and channel event messages
 */
const UnMemoizedEventComponent = (props: EventComponentProps) => {
  const { message, unsafeHTML = false } = props;
  const { type } = message;

  if (type !== 'system') return null;

  return (
    <div className='str-chat__message--system' data-testid='message-system'>
      <div className='str-chat__message--system__text'>
        {unsafeHTML ? (
          <div
            dangerouslySetInnerHTML={{ __html: message.html || '' }}
            data-unsafe-inner-html
          />
        ) : (
          <span>{message.text}</span>
        )}
      </div>
    </div>
  );
};

export const EventComponent = React.memo(
  UnMemoizedEventComponent,
) as typeof UnMemoizedEventComponent;
