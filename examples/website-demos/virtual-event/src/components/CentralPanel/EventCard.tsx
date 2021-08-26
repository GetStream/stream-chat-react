import { useState } from 'react';
import { EventCardIcon, ParticipantsIcon, VideoViewersIcon } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';
import { useVideoContext } from '../../contexts/VideoContext';

type Props = {
  chatType: 'main-event' | 'room';
  content: string;
  eventName: string;
  eventNumber: number;
  label: string;
  presenters: number;
  title: string;
  jpeg?: string;
  upcoming?: boolean;
  viewers?: number;
};

export const EventCard: React.FC<Props> = (props) => {
  const {
    chatType,
    content,
    eventName,
    eventNumber,
    jpeg,
    label,
    presenters,
    title,
    upcoming,
    viewers,
  } = props;

  const [pressed, setPressed] = useState(false);

  const {
    setChatType,
    setEventName,
    setSelected,
    setShowChannelList,
    setVideoOpen,
  } = useEventContext();
  const { setEventNumber, setLabel, setPresenters, setTitle, setViewers } = useVideoContext();

  const handleClick = () => {
    if (upcoming) return;

    setChatType(chatType);
    setEventName(eventName);
    setEventNumber(eventNumber);
    setLabel(label);
    setPresenters(presenters);
    setShowChannelList(false);
    setSelected(chatType === 'main-event' ? 'main-event' : 'rooms');
    setTitle(title);
    setVideoOpen(true);
    setViewers(viewers);
  };

  return (
    <div
      className={`event-card-container ${upcoming ? 'upcoming' : ''} ${pressed ? 'pressed' : ''}`}
      onClick={handleClick}
      onMouseDown={() => setPressed(true)}
      onMouseLeave={() => setPressed(false)}
      onMouseUp={() => setPressed(false)}
    >
      {jpeg && <img className='event-card-image' alt='jpeg' src={jpeg} />}
      <div className='event-card-content'>
        <div className='event-card-title'>
          <EventCardIcon />
          <div className='event-card-title-text'>{title}</div>
        </div>
        <div className='event-card-content-content'>{content}</div>
        <div className='event-card-footer'>
          <div className='event-card-viewers'>
            {presenters && (
              <div className='event-card-viewers-left'>
                <ParticipantsIcon />
                <div className='event-card-viewers-left-count'>{presenters}</div>
              </div>
            )}
            {viewers && (
              <div className='event-card-viewers-right'>
                <VideoViewersIcon />
                <div className='event-card-viewers-right-count'>{viewers}</div>
              </div>
            )}
          </div>
          <div
            className={`event-card-label ${label === 'Moderated' ? 'moderated' : ''}${
              label === 'Open' ? 'open' : ''
            }`}
          >
            {label}
          </div>
        </div>
      </div>
    </div>
  );
};
