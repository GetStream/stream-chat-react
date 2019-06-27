import React from 'react';
import moment from 'moment';
import { Avatar } from './Avatar';

export class EventComponent extends React.PureComponent {
  render() {
    const { message } = this.props;
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
        <div style={{ display: 'flex', marginTop: '20px' }}>
          <Avatar
            image={message.event.user.image}
            name={message.event.user.name || message.event.user.id}
          />
          <div
            style={{
              marginRight: '10px',
              color: 'rgba(0,0,0,0.5)',
              fontSize: '15px',
            }}
          >
            <em>{sentence}</em>
            <div style={{ fontSize: '11px', marginTop: '4px' }}>
              {moment(message.created_at).format('LT')}
            </div>
          </div>
        </div>
      );
    }

    return null;
  }
}
