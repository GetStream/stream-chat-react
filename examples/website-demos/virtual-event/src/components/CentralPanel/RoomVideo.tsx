import { BaseSyntheticEvent, useState } from 'react';

import { useVideoContext } from '../../contexts/VideoContext';

import {
  BackArrow,
  ConnectionStatus,
  Listening,
  Muted,
  ParticipantsIcon,
  Speaking,
  VideoViewersIcon,
} from '../../assets';

import part1 from '../../assets/participant01.jpg';
import part2 from '../../assets/participant02.jpg';
import part3 from '../../assets/participant07.jpg';
import part4 from '../../assets/participant04.jpg';
import part5 from '../../assets/participant05.jpg';
import part6 from '../../assets/participant06.jpg';

type Props = {
  handleBackArrow: (event: BaseSyntheticEvent) => void;
};

export const RoomVideo: React.FC<Props> = ({ handleBackArrow }) => {
  const [isPinned, setIsPinned] = useState(false);
  const [pinnedID, setPinnedID] = useState(null);

  const { label, presenters, title, viewers } = useVideoContext();

  const handleClick = (event: BaseSyntheticEvent) => {
    if (!isPinned) {
      setIsPinned(true);
      setPinnedID(event.target.id);
    }
    if (isPinned && event.target.id === pinnedID) {
      setIsPinned(false);
      setPinnedID(null);
    }

    if (isPinned && pinnedID !== event.target.id) {
      setPinnedID(event.target.id);
    }
  };

  return (
    <div className='room-video-container'>
      <div className='room-video-header'>
        <div className='room-video-header-title'>
          <div className='room-video-header-title-arrow' onClick={handleBackArrow}>
            <BackArrow />
          </div>
          <div className='room-video-header-title-title'>{title}</div>
          <div className='room-video-header-title-dot'></div>
          <div className='room-video-header-title-recording'>Recording</div>
        </div>
        <div className='room-video-header-title-right'>
          <ParticipantsIcon />
          <div>{presenters}</div>
          <VideoViewersIcon />
          <div>{viewers}</div>
          <div className={`event-card-label ${label?.toLowerCase()}`}>{label}</div>
        </div>
      </div>
      <div className={`room-video-grid ${isPinned ? 'isPinned' : ''}`}>
        <div
          className={`room-video-grid-participant ${pinnedID === '1' ? 'pinned' : ''}`}
          id='1'
          style={{ backgroundImage: `url(${part1})`, backgroundSize: 'cover' }}
          onClick={handleClick}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Lita Sherman</div>
            <Speaking />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '2' ? 'pinned' : ''}`}
          id='2'
          onClick={handleClick}
          style={{ backgroundImage: `url(${part2})`, backgroundSize: 'cover' }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Kirk Purdie</div>
            <Listening />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '3' ? 'pinned' : ''}`}
          id='3'
          onClick={handleClick}
          style={{ backgroundImage: `url(${part5})`, backgroundSize: 'cover' }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Khalid Ignác</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '4' ? 'pinned' : ''}`}
          id='4'
          onClick={handleClick}
          style={{ backgroundImage: `url(${part6})`, backgroundSize: 'cover' }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Jaana Kirstie</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '5' ? 'pinned' : ''}`}
          id='5'
          onClick={handleClick}
          style={{ backgroundImage: `url(${part3})`, backgroundSize: 'cover' }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Neal Sameera</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
        <div
          className={`room-video-grid-participant ${pinnedID === '6' ? 'pinned' : ''}`}
          id='6'
          onClick={handleClick}
          style={{ backgroundImage: `url(${part4})`, backgroundSize: 'cover' }}
        >
          <div className='room-video-grid-participant-info'>
            <div className='room-video-grid-participant-info-name'>Halide Nursultan</div>
            <Muted />
          </div>
          <div className='room-video-grid-participant-connection'>
            <ConnectionStatus />
          </div>
        </div>
      </div>
    </div>
  );
};
