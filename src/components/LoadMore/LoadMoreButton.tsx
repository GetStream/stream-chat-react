import React from 'react';
import { LoadingIndicator } from 'react-file-utils';

import { useChatContext } from '../../context/ChatContext';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** If true, LoadingIndicator is displayed instead of button */
  refreshing?: boolean;
};

const UnMemoizedLoadMoreButton: React.FC<LoadMoreButtonProps> = (props) => {
  const { children = 'Load more', onClick, refreshing } = props;

  const { loadMoreRef } = useChatContext('LoadMoreButton');

  return (
    <div className='str-chat__load-more-button'>
      <button
        aria-label='Load More Channels'
        className='str-chat__load-more-button__button'
        data-testid='load-more-button'
        disabled={refreshing}
        onClick={onClick}
        ref={loadMoreRef}
      >
        {refreshing ? <LoadingIndicator /> : children}
      </button>
    </div>
  );
};

export const LoadMoreButton = React.memo(
  UnMemoizedLoadMoreButton,
) as typeof UnMemoizedLoadMoreButton;
