import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type LoadingErrorIndicatorProps = {
  /** Error object */
  error?: Error;
};

/**
 * UI component for error indicator in a Channel
 */
const UnMemoizedLoadingErrorIndicator = ({ error }: LoadingErrorIndicatorProps) => {
  const { t } = useTranslationContext('LoadingErrorIndicator');

  if (!error) return null;

  return (
    <div>
      {t<string>('Error: {{ errorMessage }}', { errorMessage: error.message })}
    </div>
  );
};

export const LoadingErrorIndicator = React.memo(
  UnMemoizedLoadingErrorIndicator,
  (prevProps, nextProps) => prevProps.error?.message === nextProps.error?.message,
) as typeof UnMemoizedLoadingErrorIndicator;
