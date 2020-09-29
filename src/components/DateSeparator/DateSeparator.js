// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { TranslationContext } from '../../context';

/**
 * DateSeparator - A simple date separator
 *
 * @example ../../docs/DateSeparator.md
 * @type {React.FC<import('types').DateSeparatorProps>}
 */
const DateSeparator = ({ position = 'right', formatDate, date, unread }) => {
  const { t, tDateTimeParser } = useContext(TranslationContext);
  if (typeof date === 'string') return null;

  const formattedDate = formatDate
    ? formatDate(date)
    : tDateTimeParser(date.toISOString()).calendar();

  return (
    <div className="str-chat__date-separator">
      {(position === 'right' || position === 'center') && (
        <hr className="str-chat__date-separator-line" />
      )}
      <div className="str-chat__date-separator-date">
        {unread ? t('New') : formattedDate}
      </div>
      {(position === 'left' || position === 'center') && (
        <hr className="str-chat__date-separator-line" />
      )}
    </div>
  );
};

DateSeparator.propTypes = {
  /** The date to format */
  date: PropTypes.instanceOf(Date).isRequired,
  /** If following messages are not new */
  unread: PropTypes.bool,
  /** Set the position of the date in the separator */
  position: PropTypes.oneOf(['left', 'center', 'right']),
  /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
  formatDate: PropTypes.func,
};

export default React.memo(DateSeparator);
