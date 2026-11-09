import React from 'react';

import { useTranslationContext } from '../../context/TranslationContext';

export type LoadingErrorIndicatorProps = {
  error?: Error | null;
};

/** Renders the error message, or nothing when there is no error. */
const UnMemoizedLoadingErrorIndicator = ({ error }: LoadingErrorIndicatorProps) => {
  const { t } = useTranslationContext();

  if (!error) return null;

  return (
    <div>
      {t('loading.errorIndicator.error.text', 'Error: {{ errorMessage }}', {
        errorMessage: error.message,
      })}
    </div>
  );
};

export const LoadingErrorIndicator = React.memo(
  UnMemoizedLoadingErrorIndicator,
  (prevProps, nextProps) => prevProps.error?.message === nextProps.error?.message,
) as typeof UnMemoizedLoadingErrorIndicator;
