import React from 'react';
import { MessageTeam } from 'stream-chat-react';

import './TeamMessage.css';

export const TeamMessage = (props) => {
  return (
    <div>
      <MessageTeam {...props} />
      {/** potentially add replies component here */}
    </div>
  );
};
