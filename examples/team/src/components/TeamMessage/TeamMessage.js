import React from 'react';
import { MessageTeam } from 'stream-chat-react';

import './TeamMessage.css';

export const TeamMessage = (props) => {
  // const { message } = props;

  return (
    <div>
      <MessageTeam {...props} />
    </div>
  );
};
