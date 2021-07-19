import { EventCardIcon } from '../../assets/EventCardIcon';
import { VideoViewersIcon } from '../../assets/VideoViewersIcon';
import { ViewersIcon } from '../../assets/ViewersIcon';
import './EventCard.scss';

type EventCardProps = {
  content: string;
  label: string;
  title: string;
  videoViewers?: number;
  viewers?: number;
};

export const EventCard = (props: EventCardProps) => {
  const { content, label, title, videoViewers, viewers } = props;

  return (
    <div className='event-card-container'>
      <div className='event-card-image'></div>
      <div className='event-card-content'>
        <div className='event-card-title'>
          <EventCardIcon />
          <div className='event-card-title-text'>{title}</div>
        </div>
        <div className='event-card-content-content'>{content}</div>
        <div className='event-card-footer'>
          <div className='event-card-viewers'>
            {viewers && (
              <div className='event-card-viewers-left'>
                <ViewersIcon />
                <div className='event-card-viewers-left-count'>{viewers}</div>
              </div>
            )}
            {videoViewers && (
              <div className='event-card-viewers-right'>
                <VideoViewersIcon />
                <div className='event-card-viewers-right-count'>{videoViewers}</div>
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
