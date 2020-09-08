// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Avatar } from '../Avatar';
import { TranslationContext } from '../../context';

/**
 * EventComponent - Custom render component for system and channel event messages
 * @type {React.FC<import('types').EventComponentProps>}
 */
const EventComponent = ({ message }) => {
  const { tDateTimeParser } = useContext(TranslationContext);
  const { type, text, event, created_at = '' } = message;

  if (type === 'system')
    return (
      <div className="str-chat__message--system">
        <div className="str-chat__message--system__text">
          <div className="str-chat__message--system__line" />
          <p>{text}</p>
          <div className="str-chat__message--system__line" />
        </div>
        <div className="str-chat__message--system__date">
          <strong>{tDateTimeParser(created_at).format('dddd')} </strong>
          at {tDateTimeParser(created_at).format('hh:mm A')}
        </div>
      </div>
    );

  if (
    type === 'channel.event' &&
    event &&
    (event.type === 'member.removed' || event.type === 'member.added')
  ) {
    const name = event?.user?.name || event?.user?.id;
    const sentence = `${name} ${
      event.type === 'member.added'
        ? 'has joined the chat'
        : 'was removed from the chat'
    }`;

    return (
      <div className="str-chat__event-component__channel-event">
        <Avatar image={event?.user?.image} name={name} />
        <div className="str-chat__event-component__channel-event__content">
          <em className="str-chat__event-component__channel-event__sentence">
            {sentence}
          </em>
          <div className="str-chat__event-component__channel-event__date">
            {tDateTimeParser(created_at).format('LT')}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

EventComponent.propTypes = {
  /** Message object */
  // @ts-ignore
  message: PropTypes.object.isRequired,
};

export default React.memo(EventComponent);
