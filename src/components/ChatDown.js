import React from 'react';
import PropTypes from 'prop-types';

import { LoadingChannels } from './LoadingChannels';

import placeholder from '../assets/str-chat__connection-error.svg';

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
    /** The type of error */
    type: PropTypes.string,
    /** The error message to show */
    text: PropTypes.string,
  };

  static defaultProps = {
    image: placeholder,
    type: 'Error',
    text: 'Error connecting to chat, refresh the page to try again.',
  };

  render() {
    const { image, type, text } = this.props;

    return (
      <div className="str-chat__down">
        <LoadingChannels />
        <div className="str-chat__down-main">
          <img src={image} />
          <h1>{type}</h1>
          <h3>{text}</h3>
        </div>
      </div>
    );
  }
}
