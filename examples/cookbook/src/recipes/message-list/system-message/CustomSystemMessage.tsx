import type { PropsWithChildren } from 'react';
import { convertTimestampToDate } from 'stream-chat';
import type { EventComponentProps } from 'stream-chat-react';
import { Avatar, WithComponents } from 'stream-chat-react';
import './CustomSystemMessage.css';

const CustomSystemMessage = ({ message }: EventComponentProps) => {
  const { created_at, text, user } = message;
  const date = convertTimestampToDate(created_at);
  const userName = user?.name || user?.id;

  return (
    <div className='cookbook-system-message'>
      <div className='cookbook-system-message__text'>{text?.trim()}</div>
      <div className='cookbook-system-message__meta'>
        {user && (
          <span className='cookbook-system-message__actor'>
            <Avatar imageUrl={user.image} size='xs' userName={userName} />
            {userName}
          </span>
        )}
        {date && (
          <time dateTime={date.toISOString()}>
            {date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
          </time>
        )}
      </div>
    </div>
  );
};

// Declared once, so WithComponents gets the same object on every render.
const overrides = { MessageSystem: CustomSystemMessage };

export const WithCustomSystemMessages = ({ children }: PropsWithChildren) => (
  <WithComponents overrides={overrides}>{children}</WithComponents>
);
