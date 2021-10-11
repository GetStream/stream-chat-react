import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type EmptyStateIndicatorProps = {
  /** List Type: channel | message */
  listType: 'channel' | 'message';
};

const UnMemoizedEmptyStateIndicator: React.FC<EmptyStateIndicatorProps> = (props) => {
  const { listType } = props;

  const { t } = useTranslationContext('EmptyStateIndicator');

  if (listType === 'channel') return <p>{t('You have no channels currently')}</p>;

  if (listType === 'message') return null;

  return <p>No items exist</p>;
};

export const EmptyStateIndicator = React.memo(
  UnMemoizedEmptyStateIndicator,
) as typeof UnMemoizedEmptyStateIndicator;
