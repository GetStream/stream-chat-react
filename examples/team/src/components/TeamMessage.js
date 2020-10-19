import React from 'react';
import {
  MessageTeam,
  // TranslationContext
} from 'stream-chat-react';

import './TeamMessage.css';

export const TeamMessage = (props) => {
  // const { message } = props;
  // const { tDateTimeParser } = useContext(TranslationContext);

  return (
    <div>
      {/* {message.type === 'regular' && (
        <p className="team-message__user__time">
          {tDateTimeParser(message.created_at).format('h:mm A')}
        </p>
      )} */}
      <MessageTeam {...props} formatDate="h:mm A" />
    </div>
  );
};
