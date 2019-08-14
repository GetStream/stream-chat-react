import React from 'react';
import moment from 'moment';
import { Avatar } from './Avatar';
import { injectIntl } from 'react-intl';

class EventComponent extends React.PureComponent {
  render() {
    const { message, intl } = this.props;
    if (message.type === 'system') {
      return (
        <div className="str-chat__message--system">
          <div className="str-chat__message--system__text">
            <div className="str-chat__message--system__line" />
            <p>{message.text}</p>
            <div className="str-chat__message--system__line" />
          </div>
          <div className="str-chat__message--system__date">
            <strong>{moment(message.created_at).format('dddd')} </strong>
            at {moment(message.created_at).format('hh:mm A')}
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
          sentence = intl.formatMessage(
            {
              id: 'event_component.member_removed',
              defaultMessage: '{user} was removed from the chat',
            },
            {
              user: message.event.user.name || message.event.user.id,
            },
          );
          break;
        case 'member.added':
          sentence = intl.formatMessage(
            {
              id: 'event_component.member_added',
              defaultMessage: '{user} has joined the chat',
            },
            {
              user: message.event.user.name || message.event.user.id,
            },
          );
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
              {moment(message.created_at).format('LT')}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }
}

EventComponent = injectIntl(EventComponent);
export { EventComponent };
