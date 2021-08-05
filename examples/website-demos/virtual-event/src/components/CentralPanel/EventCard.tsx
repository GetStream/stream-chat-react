import { EventCardIcon, ParticipantsIcon, VideoViewersIcon } from '../../assets';
import { useEventContext } from '../../contexts/EventContext';

type Props = {
  chatType: 'main-event' | 'room';
  content: string;
  eventName: string;
  label: string;
  presenters: number;
  title: string;
  Image?: React.FC;
  viewers?: number;
};

export const EventCard: React.FC<Props> = (props) => {
  const { chatType, content, eventName, Image, label, presenters, title, viewers } = props;

  const { setChatType, setEventName, setSelected, setShowChannelList } = useEventContext();

  const handleClick = () => {
    setEventName(eventName);
    setChatType(chatType);
    setShowChannelList(false);
    setSelected(chatType === 'main-event' ? 'main-event' : 'rooms');
  };

  return (
    <div className='event-card-container' onClick={handleClick}>
      {Image && (
        <div className='event-card-image'>
          <Image />
        </div>
      )}
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
