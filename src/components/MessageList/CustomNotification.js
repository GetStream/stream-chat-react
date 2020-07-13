import React from 'react';
import PropTypes from 'prop-types';

const CustomNotification = ({ children, active, type }) => {
  if (!active) return null;

  return (
    <div
      className={`str-chat__custom-notification notification-${type}`}
      data-testid="custom-notification"
    >
      {children}
    </div>
  );
};

CustomNotification.propTypes = {
  active: PropTypes.bool,
  type: PropTypes.string,
};

export default React.memo(CustomNotification);
