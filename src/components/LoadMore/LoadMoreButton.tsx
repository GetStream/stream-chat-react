import type { PropsWithChildren } from 'react';
import React, { useEffect } from 'react';
import { LoadingIndicator } from '../Loading';
import { deprecationAndReplacementWarning } from '../../utils/deprecationWarning';
import { useTranslationContext } from '../../context';
import { Button } from '../Button';

export type LoadMoreButtonProps = {
  /** onClick handler load more button. Pagination logic should be executed in this handler. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** indicates whether a loading request is in progress */
  isLoading?: boolean;
  /**
   * @desc If true, LoadingIndicator is displayed instead of button
   * @deprecated Use loading prop instead of refreshing. Planned for removal: https://github.com/GetStream/stream-chat-react/issues/1804
   */
  refreshing?: boolean;
};

const UnMemoizedLoadMoreButton = ({
  children,
  isLoading,
  onClick,
  refreshing,
}: PropsWithChildren<LoadMoreButtonProps>) => {
  const { t } = useTranslationContext('UnMemoizedLoadMoreButton');

  const childrenOrDefaultString = children ?? t('Load more');
  const loading = typeof isLoading !== 'undefined' ? isLoading : refreshing;

  useEffect(() => {
    deprecationAndReplacementWarning([[{ refreshing }, { isLoading }]], 'LoadMoreButton');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className='str-chat__load-more-button'>
      <Button
        appearance='outline'
        aria-label={t('aria/Load More Channels')}
        data-testid='load-more-button'
        disabled={loading}
        onClick={onClick}
        size='sm'
        variant='secondary'
      >
        {loading ? <LoadingIndicator /> : childrenOrDefaultString}
      </Button>
    </div>
  );
};

export const LoadMoreButton = React.memo(
  UnMemoizedLoadMoreButton,
) as typeof UnMemoizedLoadMoreButton;
