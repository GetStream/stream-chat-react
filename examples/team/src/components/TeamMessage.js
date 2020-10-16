import React from 'react';
import { Avatar, MessageTeam } from 'stream-chat-react';

import './TeamMessage.css';

export const TeamMessage = (props) => {
  const { message } = props;
  // console.log('TeamMessage -> message', message);

  const formatTime = (time) => {
    let hours = time.getHours();
    let minutes = time.getMinutes();
    const period = hours > 12 ? 'PM' : 'AM';

    if (hours > 12) {
      hours -= 12;
    }

    if (String(minutes).length === 1) {
      minutes = `0${minutes}`;
    }

    return `${hours}:${minutes} ${period}`;
  };

  return (
    <div>
      {/* <p className="team-message__user__time">
        {formatTime(message.created_at)}
      </p> */}
      <MessageTeam {...props} />
    </div>
  );
};

/**
 * return (
    <div className="team-message__container">
      <Avatar image={message.user.image} size={40} />
      <div className="team-message__details">
        <div className="team-message__user">
          <p className="team-message__user__name">{message.user.name}</p>
          <p className="team-message__user__time">
            {formatTime(message.created_at)}
          </p>
        </div>
        <div className="team-message__message__wrapper">
          <p className="team-message__message__text">{message.text}</p>
        </div>
      </div>
    </div>
  );
 */
