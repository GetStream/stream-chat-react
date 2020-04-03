import React from 'react';
import PropTypes from 'prop-types';

import { LoadingChannels } from './LoadingChannels';

import placeholder from '../assets/str-chat__connection-error.svg';
import { withTranslationContext } from '../context';

/**
 * ChatDown - Indicator that chat is down or your network isn't working
 *
 * @example ./docs/ChatDown.md
 * @extends PureComponent
 */
class ChatDown extends React.PureComponent {
  static propTypes = {
    /** The image url for this error */
    image: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    /** The type of error */
    type: PropTypes.string,
    /** The error message to show */
    text: PropTypes.string,
  };

  static defaultProps = {
    image: placeholder,
    type: 'Error',
  };

  render() {
    const { image, type, text, t } = this.props;

    return (
      <div className="str-chat__down" data-testid="chat-down">
        <LoadingChannels />
        <div className="str-chat__down-main">
          <img src={image} />
          <h1>{type}</h1>
          <h3>
            {text ||
              t('Error connecting to chat, refresh the page to try again.')}
          </h3>
        </div>
      </div>
    );
  }
}

ChatDown = withTranslationContext(ChatDown);
export { ChatDown };
