import React from 'react';

import PropTypes from 'prop-types';

export class MessageRepliesCountButton extends React.PureComponent {
  static propTypes = {
    /** Label for number of replies, when count is 1 */
    labelSingle: PropTypes.string,
    /** Label for number of replies, when count is more than 1 */
    labelPlural: PropTypes.string,
    /** Number of replies */
    reply_count: PropTypes.number,
    /**
     * click handler for button
     * @param event React's MouseEventHandler event
     * @returns void
     * */
    onClick: PropTypes.func,
  };
  static defaultProps = {
    labelSingle: 'reply',
    labelPlural: 'replies',
    reply_count: 0,
  };

  render() {
    const { reply_count, labelSingle, labelPlural } = this.props;
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
          {reply_count} {reply_count === 1 ? labelSingle : labelPlural}
        </button>
      );
    }
    return null;
  }
}
