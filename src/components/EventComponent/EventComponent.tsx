import React from 'react';

import { AvatarProps, Avatar as DefaultAvatar } from '../Avatar';

import { isDayOrMoment, useTranslationContext } from '../../context/TranslationContext';

import type { StreamMessage } from '../../context/ChannelStateContext';

import type {
  DefaultAttachmentType,
  DefaultChannelType,
  DefaultCommandType,
  DefaultEventType,
  DefaultMessageType,
  DefaultReactionType,
  DefaultUserType,
} from '../../types/types';

export type EventComponentProps<
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
> = {
  /** Message object */
  message: StreamMessage<At, Ch, Co, Ev, Me, Re, Us>;
  /** Custom UI component to display user avatar, defaults to and accepts same props as: [Avatar](https://github.com/GetStream/stream-chat-react/blob/master/src/components/Avatar/Avatar.tsx) */
  Avatar?: React.ComponentType<AvatarProps>;
};

/**
 * Component to display system and channel event messages
 */
const UnMemoizedEventComponent = <
  At extends DefaultAttachmentType = DefaultAttachmentType,
  Ch extends DefaultChannelType = DefaultChannelType,
  Co extends DefaultCommandType = DefaultCommandType,
  Ev extends DefaultEventType = DefaultEventType,
  Me extends DefaultMessageType = DefaultMessageType,
  Re extends DefaultReactionType = DefaultReactionType,
  Us extends DefaultUserType<Us> = DefaultUserType
>(
  props: EventComponentProps<At, Ch, Co, Ev, Me, Re, Us>,
) => {
  const { Avatar = DefaultAvatar, message } = props;

  const { tDateTimeParser } = useTranslationContext('EventComponent');
  const { created_at = '', event, text, type } = message;

  const dateFormatter = (date: string | Date, format: string) => {
    const parsedDate = tDateTimeParser(date);
    const formattedDate = isDayOrMoment(parsedDate) ? parsedDate.format(format) : parsedDate;
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

  if (event?.type === 'member.removed' || event?.type === 'member.added') {
    const name = event.user?.name || event.user?.id;
    const sentence = `${name} ${
      event.type === 'member.added' ? 'has joined the chat' : 'was removed from the chat'
    }`;

    return (
      <div className='str-chat__event-component__channel-event'>
        <Avatar image={event.user?.image} name={name} user={event.user} />
        <div className='str-chat__event-component__channel-event__content'>
          <em className='str-chat__event-component__channel-event__sentence'>{sentence}</em>
          <div className='str-chat__event-component__channel-event__date'>
            {dateFormatter(created_at, 'LT')}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export const EventComponent = React.memo(
  UnMemoizedEventComponent,
) as typeof UnMemoizedEventComponent;
