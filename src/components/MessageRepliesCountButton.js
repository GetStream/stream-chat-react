import React from 'react';

import PropTypes from 'prop-types';
import { FormattedMessage } from 'react-intl';

export class MessageRepliesCountButton extends React.PureComponent {
  static propTypes = {
    reply_count: PropTypes.number,
    onClick: PropTypes.func,
  };

  static defaultProps = {
    reply_count: 0,
  };

  render() {
    const { reply_count } = this.props;

    if (reply_count && reply_count !== 0) {
      return (
        <button
          className="str-chat__message-replies-count-button"
          onClick={this.props.onClick}
        >
          <svg width="18" height="15" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M.56 10.946H.06l-.002-.498L.025.92a.5.5 0 1 1 1-.004l.032 9.029H9.06v-4l9 4.5-9 4.5v-4H.56z"
              fillRule="nonzero"
            />
          </svg>
          <FormattedMessage
            id="message_replies.count_button"
            defaultMessage="{count, plural, one {# reply} other {# replies}}"
            values={{ count: reply_count }}
          />
        </button>
      );
    }
    return null;
  }
}
