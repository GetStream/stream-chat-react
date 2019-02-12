import React from 'react';
import Moment from 'moment';
import PropTypes from 'prop-types';

/**
 * DateSeparator - A simple date seperator
 *
 * @example ./docs/DateSeparator.md
 * @extends PureComponent
 */
export class DateSeparator extends React.PureComponent {
  static propTypes = {
    /** The date to format */
    date: PropTypes.instanceOf(Date),
  };
  render() {
    if (!Date.parse(this.props.date)) {
      return null;
    }
    return (
      <div className="str-chat__date-separator">
        <hr className="str-chat__date-separator-line" />
        <div className="str-chat__date-separator-date">
          {Moment(this.props.date.toISOString()).calendar(null, {
            lastDay: '[Yesterday]',
            sameDay: '[Today]',
            nextDay: '[Tomorrow]',
            lastWeek: '[Last] dddd',
            nextWeek: 'dddd',
            sameElse: 'L',
          })}
        </div>
      </div>
    );
  }
}
