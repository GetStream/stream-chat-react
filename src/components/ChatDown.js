import React from 'react';
import PropTypes from 'prop-types';

import { LoadingChannels } from './LoadingChannels';

import placeholder from '../assets/str-chat__connection-error.svg';
import { FormattedMessage } from 'react-intl';

/**
 * ChatDown - Indicator that chat is down or your network isn't working
 *
 * @example ./docs/ChatDown.md
 * @extends PureComponent
 */
export class ChatDown extends React.PureComponent {
  static propTypes = {
    /** The image url for this error */
    image: PropTypes.string,
  };

  static defaultProps = {
    image: placeholder,
  };

  render() {
    const { image } = this.props;

    return (
      <div className="str-chat__down">
        <LoadingChannels />
        <div className="str-chat__down-main">
          <img src={image} />
          <h1>
            <FormattedMessage
              id="chat_down.connection_error"
              defaultMessage="Connection Error"
            />
          </h1>
          <h3>
            <FormattedMessage
              id="chat_down.connection_error_text"
              defaultMessage="Error connecting to chat, refresh the page to try again."
            />
          </h3>
        </div>
      </div>
    );
  }
}
