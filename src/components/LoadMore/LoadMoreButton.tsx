import React from 'react';
import { LoadingIndicator } from 'react-file-utils';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** If true, LoadingIndicator is displayed instead of button */
  refreshing?: boolean;
};

const UnMemoizedLoadMoreButton: React.FC<LoadMoreButtonProps> = (props) => {
  const { children = 'Load more', onClick, refreshing } = props;

  return (
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
};

export const LoadMoreButton = React.memo(
  UnMemoizedLoadMoreButton,
) as typeof UnMemoizedLoadMoreButton;
