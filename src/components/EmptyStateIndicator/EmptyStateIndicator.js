import React from 'react';
import PropTypes from 'prop-types';

import { withTranslationContext } from '../../context';

const EmptyStateIndicator = ({ listType, t }) => {
  if (listType === 'channel')
    return <p>{t('You have no channels currently')}</p>;

  if (listType === 'message') return null;

  return <p>No items exist</p>;
};

EmptyStateIndicator.propTypes = {
  /** channel | message */
  listType: PropTypes.string,
};

export default withTranslationContext(React.memo(EmptyStateIndicator));
