import React, { PropsWithChildren } from 'react';
import { LoadingIndicator } from '../Loading';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** If true, LoadingIndicator is displayed instead of button */
  refreshing?: boolean;
};

const UnMemoizedLoadMoreButton = (props: PropsWithChildren<LoadMoreButtonProps>) => {
  const { children = 'Load more', onClick, refreshing } = props;

  return (
    <div className='str-chat__load-more-button'>
      <button
        aria-label='Load More Channels'
        className='str-chat__load-more-button__button str-chat__cta-button'
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
