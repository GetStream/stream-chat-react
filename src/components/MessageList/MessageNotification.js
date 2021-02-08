// @ts-check
import React from 'react';
import PropTypes from 'prop-types';

/** @type {React.FC<import('types').MessageNotificationProps>} */
const MessageNotification = ({ children, onClick, showNotification }) => {
  if (!showNotification) return null;
  return (
    <button
      className='str-chat__message-notification'
      data-testid='message-notification'
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
  /** Onclick handler */
  onClick: PropTypes.func.isRequired,
  /** If we should show the notification or not */
  showNotification: PropTypes.bool.isRequired,
};

export default React.memo(MessageNotification);
