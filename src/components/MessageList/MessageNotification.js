// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

/** @type {React.FC<import('types').MessageNotificationProps>} */
const MessageNotification = ({ showNotification, onClick, children }) => {
  if (!showNotification) return null;
  return (
    <button
      data-testid="message-notification"
      className="str-chat__message-notification"
      onClick={onClick}
    >
      {children}
    </button>
  );
};

MessageNotification.defaultProps = {
  showNotification: true,
};

MessageNotification.propTypes = {
  /** If we should show the notification or not */
  showNotification: PropTypes.bool.isRequired,
  /** Onclick handler */
  onClick: PropTypes.func.isRequired,
};

export default React.memo(MessageNotification);
