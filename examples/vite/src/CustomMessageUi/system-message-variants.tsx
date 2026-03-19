import type { EventComponentProps } from 'stream-chat-react';
import { Avatar } from 'stream-chat-react';

import './system-message-variants.css';

export const CustomSystemMessage = (props: EventComponentProps) => {
  const { message } = props;

  const { created_at = '', text, user } = message;
  const date = created_at.toString();

  return (
    <div className='custom-system-message'>
      <div>
        Event: <strong>{text?.trim()}</strong> at {date}
      </div>
      <div className='custom-system-message__actor'>
        Actor:
        <Avatar imageUrl={user?.image} size='sm' userName={user?.name || user?.id} />
        {user?.name}
      </div>
    </div>
  );
};
