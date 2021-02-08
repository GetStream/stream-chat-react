// @ts-check
import React from 'react';
import PropTypes from 'prop-types';
// @ts-expect-error
import { LoadingIndicator } from 'react-file-utils';

/**
 * @type {React.FC<import('types').LoadMoreButtonProps>}
 */
const LoadMoreButton = ({ children = 'Load more', onClick, refreshing }) => (
  <div className='str-chat__load-more-button'>
    <button
      className='str-chat__load-more-button__button'
      data-testid='load-more-button'
      disabled={refreshing}
      onClick={onClick}
    >
      {refreshing ? <LoadingIndicator /> : children}
    </button>
  </div>
);

LoadMoreButton.propTypes = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: PropTypes.func.isRequired,
  /** If true, LoadingIndicator is displayed instead of button */
  refreshing: PropTypes.bool.isRequired,
};

export default React.memo(LoadMoreButton);
