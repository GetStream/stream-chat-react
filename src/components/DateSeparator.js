import React from 'react';
import Moment from 'moment';
import PropTypes from 'prop-types';

/**
 * DateSeparator - A simple date separator
 *
 * @example ./docs/DateSeparator.md
 * @extends PureComponent
 */
export class DateSeparator extends React.PureComponent {
  static propTypes = {
    /** The date to format */
    date: PropTypes.instanceOf(Date),
    /** Set the position of the date in the separator */
    position: PropTypes.oneOf(['left', 'center', 'right']),
    /** Override the default formatting of the date. This is a function that has access to the original date object. Returns a string or Node  */
    formatDate: PropTypes.func,
  };

  static defaultProps = {
    position: 'right',
  };
  render() {
    const { position } = this.props;
    if (!Date.parse(this.props.date)) {
      return null;
    }
    return (
      <div className="str-chat__date-separator">
        {(position === 'right' || position === 'center') && (
          <hr className="str-chat__date-separator-line" />
        )}
        <div className="str-chat__date-separator-date">
          {this.props.formatDate
            ? this.props.formatDate(this.props.date)
            : Moment(this.props.date.toISOString()).calendar(null, {
                lastDay: '[Yesterday]',
                sameDay: '[Today]',
                nextDay: '[Tomorrow]',
                lastWeek: '[Last] dddd',
                nextWeek: 'dddd',
                sameElse: 'L',
              })}
        </div>
        {(position === 'left' || position === 'center') && (
          <hr className="str-chat__date-separator-line" />
        )}
      </div>
    );
  }
}
