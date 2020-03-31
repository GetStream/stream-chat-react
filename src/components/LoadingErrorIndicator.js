import React from 'react';
import PropTypes from 'prop-types';
import { withTranslationContext } from '../context';

/**
 * LoadingErrorIndicator - UI component for error indicator in Channel.
 *
 * @example ./docs/LoadingErrorIndicator.md
 * @extends PureComponent
 */
class LoadingErrorIndicator extends React.PureComponent {
  static propTypes = {
    /** Error object */
    error: PropTypes.oneOfType([
      PropTypes.shape({
        message: PropTypes.string,
      }),
      PropTypes.bool,
    ]),
  };
  static defaultProps = {
    error: false,
  };

  render() {
    if (!this.props.error) return null;

    const { t } = this.props;
    return (
      <div>
        {t('Error: {{ errorMessage }}', {
          errorMessage: this.props.error.message,
        })}
      </div>
    );
  }
}

LoadingErrorIndicator = withTranslationContext(LoadingErrorIndicator);
export { LoadingErrorIndicator };
