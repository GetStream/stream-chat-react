import React from 'react';
import PropTypes from 'prop-types';

import DefaultLoadMoreButton from './LoadMoreButton';
import { smartRender } from '../../utils';

const LoadMorePaginator = ({
  children,
  hasNextPage,
  LoadMoreButton,
  loadNextPage,
  refreshing,
  reverse,
}) => (
  <>
    {!reverse && children}
    {hasNextPage &&
      smartRender(LoadMoreButton, { onClick: loadNextPage, refreshing })}
    {reverse && children}
  </>
);

LoadMorePaginator.defaultProps = {
  LoadMoreButton: DefaultLoadMoreButton,
};

LoadMorePaginator.propTypes = {
  /** indicates if there is a next page to load */
  hasNextPage: PropTypes.bool,
  LoadMoreButton: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.func,
    PropTypes.object,
  ]),
  /** callback to load the next page */
  loadNextPage: PropTypes.func,
  /** display the items in opposite order */
  reverse: PropTypes.bool,
};

export default React.memo(LoadMorePaginator);
