import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type LoadingErrorIndicatorProps = {
  /** Error object */
  error?: Error;
};

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ../../docs/LoadingErrorIndicator.md
 */
const UnMemoizedLoadingErrorIndicator: React.FC<LoadingErrorIndicatorProps> = ({ error }) => {
  const { t } = useTranslationContext();

  if (!error) return null;

  return <div>{t('Error: {{ errorMessage }}', { errorMessage: error.message })}</div>;
};

export const LoadingErrorIndicator = React.memo(
  UnMemoizedLoadingErrorIndicator,
  (prevProps, nextProps) => prevProps.error?.message === nextProps.error?.message,
) as typeof UnMemoizedLoadingErrorIndicator;
