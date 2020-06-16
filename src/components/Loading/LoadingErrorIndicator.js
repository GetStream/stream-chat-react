// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ../../docs/LoadingErrorIndicator.md
 * @type {React.FC<import('types').LoadingErrorIndicatorProps>}
 */
const LoadingErrorIndicator = ({ error }) => {
  const { t } = useContext(TranslationContext);
  if (!error) return null;

  return (
    // @ts-ignore
    <div>{t('Error: {{ errorMessage }}', { errorMessage: error.message })}</div>
  );
};

LoadingErrorIndicator.defaultProps = {
  error: false,
};

LoadingErrorIndicator.propTypes = {
  /** Error object */
  error: PropTypes.oneOfType([
    PropTypes.shape({ message: PropTypes.string }),
    PropTypes.bool,
  ]).isRequired,
};

export default React.memo(LoadingErrorIndicator);
