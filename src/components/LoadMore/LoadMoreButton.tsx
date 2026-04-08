import type { PropsWithChildren } from 'react';
import React from 'react';
import { LoadingIndicator } from '../Loading';
import { useTranslationContext } from '../../context';
import { Button } from '../Button';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** indicates whether a loading request is in progress */
  isLoading?: boolean;
};

const UnMemoizedLoadMoreButton = ({
  children,
  isLoading,
  onClick,
}: PropsWithChildren<LoadMoreButtonProps>) => {
  const { t } = useTranslationContext('UnMemoizedLoadMoreButton');

  const childrenOrDefaultString = children ?? t('Load more');

  return (
    <div className='str-chat__load-more-button'>
      <Button
        appearance='ghost'
        aria-label={t('aria/Load More Channels')}
        data-testid='load-more-button'
        disabled={isLoading}
        onClick={onClick}
        size='sm'
        variant='secondary'
      >
        {isLoading ? <LoadingIndicator /> : childrenOrDefaultString}
      </Button>
    </div>
  );
};

export const LoadMoreButton = React.memo(
  UnMemoizedLoadMoreButton,
) as typeof UnMemoizedLoadMoreButton;
