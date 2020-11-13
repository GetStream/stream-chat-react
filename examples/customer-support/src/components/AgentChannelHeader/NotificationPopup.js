import React from 'react';

import './NotificationPopup.css';

import { CloseIcon } from '../../assets';

export const NotificationPopup = ({ previewText, setPopupVisible }) => {
  const getMessagePreview = () => {
    return previewText.length > 40
      ? `"${previewText.slice(0, 40)}..."`
      : `"${previewText}"`;
  };

  return (
    <div className="notification-popup__container">
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
