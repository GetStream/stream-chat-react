import React, { useContext } from 'react';
import { ChatContext } from 'stream-chat-react';

import './NotificationPopup.css';

import { CloseIcon } from '../../assets';

export const NotificationPopup = (props) => {
  const { eventChannel, previewText, setPopupVisible } = props;

  const { setActiveChannel } = useContext(ChatContext);

  const getMessagePreview = () => {
    return previewText.length > 40
      ? `"${previewText.slice(0, 40)}..."`
      : `"${previewText}"`;
  };

  return (
    <div
      className="notification-popup__container"
      onClick={() => {
        if (eventChannel) setActiveChannel(eventChannel);
      }}
    >
      <div className="notification-popup__top-wrapper">
        <p className="notification-popup__top-text">AGENT DASHBOARD</p>
        <div
          className="notification-popup__dismiss"
          onClick={() => setPopupVisible(false)}
        >
          <CloseIcon />
        </div>
      </div>
      <p className="notification-popup__waiting-text">
        You have 1 new customer waiting
      </p>
      <p className="notification-popup__message-preview">
        {getMessagePreview()}
      </p>
    </div>
  );
};
