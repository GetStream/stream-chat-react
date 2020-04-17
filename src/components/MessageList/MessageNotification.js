import React from 'react';
import PropTypes from 'prop-types';

const MessageNotification = ({ showNotification, onClick, children }) => {
  if (!showNotification) return null;
  return (
    <button className="str-chat__message-notification" onClick={onClick}>
      {children}
    </button>
  );
};

MessageNotification.defaultProps = {
  showNotification: true,
};

MessageNotification.propTypes = {
  /** If we should show the notification or not */
  showNotification: PropTypes.bool,
  /** Onclick handler */
  onClick: PropTypes.func.isRequired,
};

export default React.memo(MessageNotification);
