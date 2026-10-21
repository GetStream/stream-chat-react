import type { PropsWithChildren } from 'react';
import React from 'react';
import { LoadingIndicator } from '../Loading';
import { useTranslationContext } from '../../context';
import { Button } from '../Button';

export type LoadMoreButtonProps = {
  /** Click handler; run the pagination logic here. */
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  /** Whether a load is in progress; disables the button and shows a loading indicator. */
  isLoading?: boolean;
};

const UnMemoizedLoadMoreButton = ({
  children,
  isLoading,
  onClick,
}: PropsWithChildren<LoadMoreButtonProps>) => {
  const { t } = useTranslationContext();

  const childrenOrDefaultString =
    children ?? t('loadMore.button.loadMore.label', 'Load more');

  return (
    <div className='str-chat__load-more-button'>
      <Button
        appearance='ghost'
        aria-label={t('loadMore.button.loadMore.label', 'Load more')}
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
