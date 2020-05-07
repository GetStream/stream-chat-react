import React from 'react';
import PropTypes from 'prop-types';

import { withTranslationContext } from '../../context';

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ../../docs/LoadingErrorIndicator.md
 */
const LoadingErrorIndicator = ({ error, t }) => {
  if (!error) return null;

  return (
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
  ]),
};

export default withTranslationContext(React.memo(LoadingErrorIndicator));
