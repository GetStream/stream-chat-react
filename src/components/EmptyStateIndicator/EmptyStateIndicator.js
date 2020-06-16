// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';

/**
 * @type {React.FC<import('types').EmptyStateIndicatorProps>} param0
 */
const EmptyStateIndicator = ({ listType }) => {
  const { t } = useContext(TranslationContext);
  if (listType === 'channel')
    return <p>{t('You have no channels currently')}</p>;

  if (listType === 'message') return null;

  return <p>No items exist</p>;
};

EmptyStateIndicator.propTypes = {
  /** channel | message */
  listType: PropTypes.string.isRequired,
};

export default React.memo(EmptyStateIndicator);
