import React from 'react';
import PropTypes from 'prop-types';
import { LoadingIndicator } from 'react-file-utils';

const LoadMoreButton = ({ onClick, refreshing, children }) => (
  <div className="str-chat__load-more-button">
    <button
      className="str-chat__load-more-button__button"
      onClick={onClick}
      disabled={refreshing}
    >
      {refreshing ? <LoadingIndicator /> : children}
    </button>
  </div>
);

LoadMoreButton.defaultProps = {
  children: 'Load more',
};

LoadMoreButton.propTypes = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: PropTypes.func,
  /** If true, LoadingIndicator is displayed instead of button */
  refreshing: PropTypes.bool,
};

export default React.memo(LoadMoreButton);
