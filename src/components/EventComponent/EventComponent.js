import React from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../';
import { withTranslationContext } from '../../context';

class EventComponent extends React.PureComponent {
  static propTypes = {
    /** Message object */
    message: PropTypes.object,
  };

  render() {
    const { message, tDateTimeParser } = this.props;
    if (message.type === 'system') {
      return (
        <div className="str-chat__message--system">
          <div className="str-chat__message--system__text">
            <div className="str-chat__message--system__line" />
            <p>{message.text}</p>
            <div className="str-chat__message--system__line" />
          </div>
          <div className="str-chat__message--system__date">
            <strong>
              {tDateTimeParser(message.created_at).format('dddd')}{' '}
            </strong>
            at {tDateTimeParser(message.created_at).format('hh:mm A')}
          </div>
        </div>
      );
    }

    if (
      message.type === 'channel.event' &&
      (message.event.type === 'member.removed' ||
        message.event.type === 'member.added')
    ) {
      let sentence;

      switch (message.event.type) {
        case 'member.removed':
          sentence = `${message.event.user.name ||
            message.event.user.id} was removed from the chat`;
          break;
        case 'member.added':
          sentence = `${message.event.user.name ||
            message.event.user.id} has joined the chat`;
          break;
        default:
          break;
      }
      return (
        <div className="str-chat__event-component__channel-event">
          <Avatar
            image={message.event.user.image}
            name={message.event.user.name || message.event.user.id}
          />
          <div className="str-chat__event-component__channel-event__content">
            <em className="str-chat__event-component__channel-event__sentence">
              {sentence}
            </em>
            <div className="str-chat__event-component__channel-event__date">
              {tDateTimeParser(message.created_at).format('LT')}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }
}

export default withTranslationContext(EventComponent);
