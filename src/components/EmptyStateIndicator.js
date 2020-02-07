import React from 'react';
import PropTypes from 'prop-types';

export const EmptyStateIndicator = ({ listType }) => {
  let Indicator;
  switch (listType) {
    case 'channel':
      Indicator = <p>You have no channels currently</p>;
      break;
    case 'message':
      Indicator = null;
      break;
    default:
      Indicator = <p>No items exist</p>;
      break;
  }

  return Indicator;
};

EmptyStateIndicator.propTypes = {
  /** channel | message */
  listType: PropTypes.string,
};
