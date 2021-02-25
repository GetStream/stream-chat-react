// @ts-check
import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { Avatar as DefaultAvatar } from '../Avatar';

import { isDayjs, TranslationContext } from '../../context/TranslationContext';

/**
 * EventComponent - Custom render component for system and channel event messages
 * @type {React.FC<import('types').EventComponentProps>}
 */
const EventComponent = ({ Avatar = DefaultAvatar, message }) => {
  const { tDateTimeParser } = useContext(TranslationContext);
  const { created_at = '', event, text, type } = message;

  // @ts-expect-error
  const dateFormatter = (date, format) => {
    const parsedDate = tDateTimeParser(date);
    const formattedDate = isDayjs(parsedDate)
      ? parsedDate.format(format)
      : parsedDate;
    return formattedDate;
  };

  if (type === 'system')
    return (
      <div className='str-chat__message--system'>
        <div className='str-chat__message--system__text'>
          <div className='str-chat__message--system__line' />
          <p>{text}</p>
          <div className='str-chat__message--system__line' />
        </div>
        <div className='str-chat__message--system__date'>
          <strong>{dateFormatter(created_at, 'dddd')} </strong>
          at {dateFormatter(created_at, 'hh:mm A')}
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
      <div className='str-chat__event-component__channel-event'>
        <Avatar image={event?.user?.image} name={name} />
        <div className='str-chat__event-component__channel-event__content'>
          <em className='str-chat__event-component__channel-event__sentence'>
            {sentence}
          </em>
          <div className='str-chat__event-component__channel-event__date'>
            {dateFormatter(created_at, 'LT')}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

EventComponent.propTypes = {
  /**
   * Custom UI component to display user avatar
   *
   * Defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.js)
   * */
  Avatar: /** @type {PropTypes.Validator<React.ElementType<import('types').AvatarProps>>} */ (PropTypes.elementType),
  /** Message object */
  // @ts-expect-error
  message: PropTypes.object.isRequired,
};

export default React.memo(EventComponent);
